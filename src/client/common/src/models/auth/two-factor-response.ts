/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

export interface TwoFactorResponse {
    sharedKey: string;
    recoveryCodesLeft: number;
    recoveryCodes?: string[];
    isTwoFactorEnabled: boolean;
    isMachineRemembered: boolean;
}
