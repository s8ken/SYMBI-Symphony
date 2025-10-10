export class BlackboxAdapter {
  async query(model: string, input: string): Promise<any> {
    // Mock implementation
    return { success: true, model, input };
  }
}
