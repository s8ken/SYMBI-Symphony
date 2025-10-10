import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set")
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
}

let client
let clientPromise

// Connection state tracking
let connectionState = {
  isConnected: false,
  lastError: null,
  lastConnectionTime: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5
}

function createClient() {
  const mongoClient = new MongoClient(uri, options)
  
  // Add connection event listeners
  mongoClient.on('open', () => {
    connectionState.isConnected = true
    connectionState.lastConnectionTime = new Date()
    connectionState.reconnectAttempts = 0
    connectionState.lastError = null
    console.log('MongoDB connected successfully')
  })
  
  mongoClient.on('close', () => {
    connectionState.isConnected = false
    console.log('MongoDB connection closed')
  })
  
  mongoClient.on('error', (error) => {
    connectionState.isConnected = false
    connectionState.lastError = error
    console.error('MongoDB connection error:', error)
  })
  
  mongoClient.on('serverSelectionFailed', (error) => {
    connectionState.lastError = error
    console.error('MongoDB server selection failed:', error)
  })
  
  return mongoClient
}

async function connectWithRetry() {
  for (let attempt = 1; attempt <= connectionState.maxReconnectAttempts; attempt++) {
    try {
      console.log(`MongoDB connection attempt ${attempt}/${connectionState.maxReconnectAttempts}`)
      const client = await clientPromise
      
      // Test the connection
      await client.db("admin").command({ ping: 1 })
      
      connectionState.reconnectAttempts = attempt - 1
      return client
    } catch (error) {
      connectionState.lastError = error
      connectionState.reconnectAttempts = attempt
      
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message)
      
      if (attempt === connectionState.maxReconnectAttempts) {
        throw new Error(`Failed to connect to MongoDB after ${attempt} attempts. Last error: ${error.message}`)
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      console.log(`Waiting ${waitTime}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = createClient()
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = createClient()
  clientPromise = client.connect()
}

export async function getDatabase() {
  try {
    const client = await connectWithRetry()
    return client.db(process.env.MONGODB_DATABASE_NAME || "project0")
  } catch (error) {
    console.error("Failed to get database connection:", error)
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

export async function closeDatabaseConnection() {
  try {
    if (client) {
      await client.close()
      connectionState.isConnected = false
      console.log('MongoDB connection closed successfully')
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error)
  }
}

export function getConnectionState() {
  return { ...connectionState }
}

export const connectToDatabase = getDatabase

export default clientPromise
