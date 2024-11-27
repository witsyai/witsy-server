import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const getFilePath = (folder: string, filename: string): string => {
  return path.join('data', folder, filename);
}

export const getRandomFilePath = (folder: string, extension: string): string => {
  fs.mkdirSync(path.join('data', folder), { recursive: true });
  return path.join(folder, `${crypto.randomUUID()}.${extension}`);
}

export const deleteImage = (filename: string): void => {
  fs.unlinkSync(getFilePath('images', filename));
}

export const saveFile = (folder: string, extension: string, content: Buffer): string => {

  // create a new file in the data directory
  const filePath = getRandomFilePath(folder, extension);

  // now write the file
  fs.writeFileSync(path.join('data', filePath), content);

  // return the file name
  return `/${filePath.replace(/\\/g, '/')}`;

}

export const saveFile64 = (folder: string, extension: string, b64content: string): string => {

  // decode the base64
  const content = Buffer.from(b64content, 'base64');

  // save the file
  return saveFile(folder, extension, content);

}
