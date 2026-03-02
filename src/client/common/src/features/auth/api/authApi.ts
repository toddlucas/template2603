import { get, getModel, post, postModel, put } from "../../../api";
import type { Result } from "../../../api";
import type {
  AccessTokenResponse,
  AuthStatusModel,
  ForgotPasswordRequest,
  InfoRequest,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResendConfirmationEmailRequest,
  ResetPasswordRequest,
  TwoFactorRequest,
 } from "../../../models/auth";
import type { IdentityUserModel } from "../../../models/identity-user-model";

export const postRegister = async (model: RegisterRequest, signal?: AbortSignal) =>
  post("/api/auth/register", model, signal);

/**
 * @returns AccessTokenResponse
 */
export const postTokenLogin = async (model: LoginRequest, signal?: AbortSignal): Promise<Result<AccessTokenResponse, Response>> => {
  return await postModel<LoginRequest, AccessTokenResponse>("/api/auth/login", model, signal);
}

export const postCookieLogin = (model: LoginRequest, useCookies?: boolean, useSessionCookies?: boolean, signal?: AbortSignal): Promise<Response> => {
  const url = useCookies ? `/api/auth/login?useCookies=${useCookies ? 'true' : 'false'}` : useSessionCookies ? `/api/auth/login/session?useSessionCookies=${useSessionCookies ? 'true' : 'false'}` : "/api/auth/login";
  return post(url, model, signal);
}

/**
 * @returns AccessTokenResponse
 */
export const postRefresh = (model: RefreshRequest, signal?: AbortSignal): Promise<Result<AccessTokenResponse, Response>> =>
  postModel<RefreshRequest, AccessTokenResponse>("/api/auth/refresh", model, signal);

export const getStatus = async (signal?: AbortSignal): Promise<Result<AuthStatusModel, Response>> =>
  getModel<AuthStatusModel>("/api/auth/status", signal) as Promise<Result<AuthStatusModel, Response>>;

export const getConfirmEmail = async (userId: string, code: string, changedEmail: string, signal?: AbortSignal) =>
  get(`/api/auth/confirmEmail?userId=${encodeURIComponent(userId)}&code=${encodeURIComponent(code)}&changedEmail=${encodeURIComponent(changedEmail)}`, signal);

export const postResendConfirmationEmail = async (model: ResendConfirmationEmailRequest, signal?: AbortSignal) =>
  post("/api/auth/resendConfirmationEmail", model, signal);

export const postForgotPassword = async (model: ForgotPasswordRequest, signal?: AbortSignal) =>
  post("/api/auth/forgotPassword", model, signal);

export const postResetPassword = async (model: ResetPasswordRequest, signal?: AbortSignal) =>
  post("/api/auth/resetPassword", model, signal);

export const postTwoFactor = async (model: TwoFactorRequest, signal?: AbortSignal) =>
  post("/api/auth/manage/2fa​", model, signal);

export const getInfo = async (signal?: AbortSignal) =>
  get("/api/auth/manage/info", signal);

export const postInfo = async (model: InfoRequest, signal?: AbortSignal) =>
  post("/api/auth/manage/info", model, signal);

export const postExternalToken = async (
  provider: 'Microsoft' | 'Google',
  idToken: string,
  signal?: AbortSignal,
): Promise<Result<AccessTokenResponse, Response>> =>
  postModel<{ provider: string; idToken: string }, AccessTokenResponse>(
    '/api/auth/external/token',
    { provider, idToken },
    signal,
  );

// Extended
export const getUser = async (signal?: AbortSignal) =>
  get("/api/auth/user", signal);

export const putUser = async (model: IdentityUserModel<string>, signal?: AbortSignal) =>
  put("/api/auth/user", model, signal);
