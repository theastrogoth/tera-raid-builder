import { gzip, ungzip } from 'pako';
import CJSON from './cjson';
import { Buffer } from 'buffer';

export function compress(s: string = ''){
  const compressed = gzip(s);
  const buffer = Buffer.from(compressed);
  return buffer.toString('base64');
}

export function decompress(s: string = ''){
  const buffer = Buffer.from(Buffer.from(s, 'base64'));
  const decompressed = new TextDecoder().decode(ungzip(buffer));
  return decompressed.toString();
}

export const serialize = (obj: any) => {
    const str = CJSON.stringify(obj);
    const compressedStr = compress(str);
    return compressedStr;
}

export const deserialize = (str: string) => {
    let obj: any;
    try {
        const decompressedStr = decompress(str);
        obj = CJSON.parse(decompressedStr);
    } catch {
        obj = JSON.parse(str);
    }
    return obj;
}