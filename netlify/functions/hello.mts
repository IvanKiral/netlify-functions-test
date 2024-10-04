import type { Handler, HandlerEvent } from "@netlify/functions";
import { IncomingMessage } from "http";
import * as unzipper from 'unzipper';
import * as formidable from "formidable";

const parseForm =  (req: IncomingMessage): Promise<{ fields: any; files: any }> => 
    new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        }
        resolve({ fields, files });
      });
    });

export const handler: Handler = async (event: HandlerEvent) => {
  if(event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const req = event as unknown as IncomingMessage;
    // Check if there's any body to process (ensure body contains ZIP file)
    const { fields, files } = await parseForm(req);

    const jsonData = fields.json ? JSON.parse(fields.json) : null;

    const zipFile = files.zipFile;
    if (!zipFile) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No ZIP file uploaded' }),
      };
    }

    // Read the zip file and extract its contents
    const zipBuffer = await unzipper.Open.file(zipFile.path);
    
    const fileData: Record<string, string> = {};
    for (const file of zipBuffer.files) {
      const content = await file.buffer();
      fileData[file.path] = content.toString('utf-8');
    }

    // Send back the extracted ZIP content along with the JSON data
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'ZIP file and JSON processed successfully',
        jsonData: jsonData, // Your parsed JSON data
        files: fileData, // Extracted ZIP file content
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: (err as Error).message }),
    };
  }
}