import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const saveFile = (folder: string, extension: string, contents: Buffer): string => {

  // create a new file in the data directory
  const fileName = path.join(folder, `${crypto.randomUUID()}.${extension}`);

  // now write the file
  fs.mkdirSync(path.join('data', folder), { recursive: true });
  fs.writeFileSync(path.join('data', fileName), contents);

  // return the file name
  return `/${fileName.replace(/\\/g, '/')}`;

}

export const saveFile64 = (folder: string, extension: string, b64contents: string): string => {

  // decode the base64
  const contents = Buffer.from(b64contents, 'base64');

  // save the file
  return saveFile(folder, extension, contents);

}
