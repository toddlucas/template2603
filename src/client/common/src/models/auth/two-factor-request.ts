/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

export interface TwoFactorRequest {
    enable?: boolean;
    twoFactorCode?: string;
    resetSharedKey: boolean;
    resetRecoveryCodes: boolean;
    forgetMachine: boolean;
}
