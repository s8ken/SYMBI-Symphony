import { Bitstring } from './bitstring';
import {
  StatusList2021Credential,
  StatusList2021Entry,
  StatusListConfig,
  StatusCheckResult,
  StatusPurpose,
  RevocationRecord,
  StatusListMetadata,
} from './types';

/**
 * Status List 2021 Manager
 *
 * Manages creation, updates, and verification of W3C Status List 2021
 * credentials for revocation and suspension.
 */
export class StatusListManager {
  private bitstrings: Map<string, Bitstring>; // listId -> bitstring
  private metadata: Map<string, StatusListMetadata>; // listId -> metadata
  private revocationRecords: Map<number, RevocationRecord>; // index -> record
  private config: StatusListConfig;
  private nextIndex: number;

  constructor(config: StatusListConfig) {
    this.config = {
      length: 131072, // 16KB compressed (128K bits)
      ...config,
    };
    this.bitstrings = new Map();
    this.metadata = new Map();
    this.revocationRecords = new Map();
    this.nextIndex = 0;
  }

  /**
   * Initialize a new status list
   */
  initializeList(listId: string): void {
    if (this.bitstrings.has(listId)) {
      throw new Error(`Status list ${listId} already exists`);
    }

    const bitstring = new Bitstring(this.config.length!);
    this.bitstrings.set(listId, bitstring);

    this.metadata.set(listId, {
      id: listId,
      issuer: this.config.issuer,
      statusPurpose: this.config.statusPurpose,
      length: this.config.length!,
      issued: new Date(),
      totalRevoked: 0,
      totalSuspended: 0,
    });
  }

  /**
   * Allocate a status list index for a new credential
   */
  allocateIndex(listId: string): StatusList2021Entry {
    if (!this.bitstrings.has(listId)) {
      this.initializeList(listId);
    }

    const index = this.nextIndex++;
    const bitstring = this.bitstrings.get(listId)!;

    if (index >= bitstring.getLength()) {
      throw new Error('Status list is full, create a new list');
    }

    const baseUrl = this.config.baseUrl || 'https://example.com/credentials/status';
    const statusListCredential = `${baseUrl}/${listId}`;

    return {
      id: `${statusListCredential}#${index}`,
      type: 'StatusList2021Entry',
      statusPurpose: this.config.statusPurpose,
      statusListIndex: index.toString(),
      statusListCredential,
    };
  }

  /**
   * Revoke or suspend a credential
   */
  setStatus(
    listId: string,
    index: number,
    revoked: boolean,
    revokedBy: string,
    reason?: string
  ): void {
    const bitstring = this.bitstrings.get(listId);
    if (!bitstring) {
      throw new Error(`Status list ${listId} not found`);
    }

    const wasSet = bitstring.get(index);

    if (revoked) {
      bitstring.set(index);

      if (!wasSet) {
        // Record new revocation
        const statusListCredential = this.getStatusListUrl(listId);
        this.revocationRecords.set(index, {
          credentialId: `credential-${index}`,
          statusListIndex: index,
          revokedAt: new Date(),
          revokedBy,
          reason,
          statusListCredential,
        });

        // Update metadata
        const meta = this.metadata.get(listId)!;
        if (this.config.statusPurpose === 'revocation') {
          meta.totalRevoked = (meta.totalRevoked || 0) + 1;
        } else {
          meta.totalSuspended = (meta.totalSuspended || 0) + 1;
        }
      }
    } else {
      bitstring.clear(index);

      if (wasSet) {
        // Update metadata
        const meta = this.metadata.get(listId)!;
        if (this.config.statusPurpose === 'revocation') {
          meta.totalRevoked = Math.max(0, (meta.totalRevoked || 0) - 1);
        } else {
          meta.totalSuspended = Math.max(0, (meta.totalSuspended || 0) - 1);
        }
      }
    }
  }

  /**
   * Check credential status
   */
  checkStatus(listId: string, index: number): StatusCheckResult {
    const bitstring = this.bitstrings.get(listId);
    if (!bitstring) {
      throw new Error(`Status list ${listId} not found`);
    }

    const isSet = bitstring.get(index);
    const purpose = this.config.statusPurpose;

    let status: 'active' | 'revoked' | 'suspended';
    if (!isSet) {
      status = 'active';
    } else {
      status = purpose === 'revocation' ? 'revoked' : 'suspended';
    }

    return {
      credentialId: `credential-${index}`,
      status,
      statusPurpose: purpose,
      checked: new Date(),
      statusListCredential: this.getStatusListUrl(listId),
      statusListIndex: index,
    };
  }

  /**
   * Generate Status List 2021 Credential
   */
  generateCredential(listId: string): StatusList2021Credential {
    const bitstring = this.bitstrings.get(listId);
    if (!bitstring) {
      throw new Error(`Status list ${listId} not found`);
    }

    const meta = this.metadata.get(listId)!;
    const statusListCredential = this.getStatusListUrl(listId);

    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/vc/status-list/2021/v1',
      ],
      id: statusListCredential,
      type: ['VerifiableCredential', 'StatusList2021Credential'],
      issuer: this.config.issuer,
      issuanceDate: meta.issued.toISOString(),
      credentialSubject: {
        id: `${statusListCredential}#list`,
        type: 'StatusList2021',
        statusPurpose: this.config.statusPurpose,
        encodedList: bitstring.encode(),
      },
    };
  }

  /**
   * Verify status from Status List 2021 Entry
   */
  async verifyStatus(statusEntry: StatusList2021Entry): Promise<StatusCheckResult> {
    // Extract list ID and index from entry
    const index = parseInt(statusEntry.statusListIndex, 10);
    const listId = this.extractListId(statusEntry.statusListCredential);

    return this.checkStatus(listId, index);
  }

  /**
   * Get revocation record
   */
  getRevocationRecord(index: number): RevocationRecord | undefined {
    return this.revocationRecords.get(index);
  }

  /**
   * Get status list metadata
   */
  getMetadata(listId: string): StatusListMetadata | undefined {
    return this.metadata.get(listId);
  }

  /**
   * Get all status lists
   */
  getAllLists(): string[] {
    return Array.from(this.bitstrings.keys());
  }

  /**
   * Get bitstring statistics
   */
  getStats(listId: string) {
    const bitstring = this.bitstrings.get(listId);
    if (!bitstring) {
      throw new Error(`Status list ${listId} not found`);
    }
    return bitstring.getStats();
  }

  /**
   * Export status list for external hosting
   */
  exportList(listId: string): {
    credential: StatusList2021Credential;
    metadata: StatusListMetadata;
    stats: ReturnType<Bitstring['getStats']>;
  } {
    const credential = this.generateCredential(listId);
    const metadata = this.metadata.get(listId)!;
    const stats = this.getStats(listId);

    return { credential, metadata, stats };
  }

  /**
   * Import existing status list
   */
  importList(credential: StatusList2021Credential): void {
    const listId = this.extractListId(credential.id);
    const encodedList = credential.credentialSubject.encodedList;

    // Decode bitstring
    const bitstring = Bitstring.decode(encodedList, this.config.length);
    this.bitstrings.set(listId, bitstring);

    // Create metadata
    this.metadata.set(listId, {
      id: listId,
      issuer: credential.issuer,
      statusPurpose: credential.credentialSubject.statusPurpose,
      length: bitstring.getLength(),
      issued: new Date(credential.issuanceDate),
      totalRevoked: bitstring.count(),
    });
  }

  /**
   * Get status list credential URL
   */
  private getStatusListUrl(listId: string): string {
    const baseUrl = this.config.baseUrl || 'https://example.com/credentials/status';
    return `${baseUrl}/${listId}`;
  }

  /**
   * Extract list ID from status list credential URL
   */
  private extractListId(url: string): string {
    const match = url.match(/\/([^\/]+)(?:#.*)?$/);
    if (!match) {
      throw new Error(`Invalid status list credential URL: ${url}`);
    }
    return match[1];
  }
}

/**
 * Verify credential status by fetching remote status list
 */
export async function verifyRemoteStatus(
  statusEntry: StatusList2021Entry,
  fetchFn: (url: string) => Promise<StatusList2021Credential> = defaultFetch
): Promise<StatusCheckResult> {
  // Fetch status list credential
  const credential = await fetchFn(statusEntry.statusListCredential);

  // Validate credential
  if (credential.credentialSubject.statusPurpose !== statusEntry.statusPurpose) {
    throw new Error('Status purpose mismatch');
  }

  // Decode bitstring
  const bitstring = Bitstring.decode(credential.credentialSubject.encodedList);

  // Check status at index
  const index = parseInt(statusEntry.statusListIndex, 10);
  const isSet = bitstring.get(index);

  let status: 'active' | 'revoked' | 'suspended';
  if (!isSet) {
    status = 'active';
  } else {
    status = statusEntry.statusPurpose === 'revocation' ? 'revoked' : 'suspended';
  }

  return {
    credentialId: statusEntry.id,
    status,
    statusPurpose: statusEntry.statusPurpose,
    checked: new Date(),
    statusListCredential: statusEntry.statusListCredential,
    statusListIndex: index,
  };
}

/**
 * Default fetch implementation
 */
async function defaultFetch(url: string): Promise<StatusList2021Credential> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vc+ld+json, application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch status list: HTTP ${response.status}`);
  }

  return response.json();
}
