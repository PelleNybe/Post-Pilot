export const makeId = (length: number) => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const randomValues = new Uint32Array(length);
  globalThis.crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(randomValues[i] % possible.length);
  }
  return text;
};
