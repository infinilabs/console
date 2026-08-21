const encoder = new TextEncoder();

const toHex = (buffer) =>
  Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

async function derivePasswordVerifier(password, salt, iterations) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto API unavailable");
  }

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );

  return toHex(new Uint8Array(bits));
}

export async function buildPasswordProof({
  password,
  username,
  challengeId,
  nonce,
  salt,
  iterations,
}) {
  const verifier = await derivePasswordVerifier(password, salt, iterations);
  const hmacKey = await window.crypto.subtle.importKey(
    "raw",
    fromHex(verifier),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(`${username}:${challengeId}:${nonce}`)
  );

  return toHex(new Uint8Array(signature));
}
