import { readFileSync } from 'fs';
import axios from 'axios';
import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';

export const readOrFetch = async (path: string) => {
  if (path.indexOf('http') === 0) {
    await validateUrlForSSRF(path);
    return (
      await axios({
        url: path,
        method: 'GET',
        responseType: 'arraybuffer',
        maxRedirects: 0,
      })
    ).data;
  }

  return readFileSync(path);
};
