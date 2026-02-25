export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

const getBaseError = (context: SecurityRuleContext) => {
  return `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:`;
};

export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    const baseError = getBaseError(context);
    const contextString = JSON.stringify(context, null, 2);
    super(`${baseError}\n${contextString}`);
    this.name = 'FirestorePermissionError';
  }
}
