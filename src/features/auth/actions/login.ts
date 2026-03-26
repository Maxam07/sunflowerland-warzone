import jwt_decode from "jwt-decode";
import { CONFIG } from "lib/config";
import { ERRORS } from "lib/errors";

type Request = {
  address: string;
  signature: string;
  transactionId: string;
};

const API_URL = CONFIG.API_URL;

export async function loginRequest(request: Request) {
  const response = await window.fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "X-Transaction-ID": request.transactionId,
    },
    body: JSON.stringify({
      address: request.address,
      signature: request.signature,
    }),
  });

  if (response.status >= 400) {
    throw new Error(ERRORS.LOGIN_SERVER_ERROR);
  }

  const { token } = await response.json();

  return { token };
}

export type Token = {
  address: string;
  exp: number;
  userAccess: {
    withdraw: boolean;
    createFarm: boolean;
    sync: boolean;
    mintCollectible: boolean;
    admin?: boolean;
    landExpansion?: boolean;
    verified?: boolean;
  };
  discordId?: string;
  farmId?: number;
};

export function decodeToken(token: string): Token {
  let decoded = jwt_decode(token) as any;

  decoded = {
    ...decoded,
    // SSO token puts fields in the properties so we need to elevate them
    ...decoded.properties,
  };

  return decoded;
}

export async function login({
  transactionId,
  address,
  signature,
}: {
  transactionId: string;
  address: string;
  signature: string;
}): Promise<{ token: string }> {
  const { token } = await loginRequest({
    address,
    signature,
    transactionId,
  });

  return { token };
}
