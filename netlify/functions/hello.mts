import type { Handler, HandlerEvent } from "@netlify/functions";
import * as unzipper from 'unzipper';

export const handler: Handler = async (event: HandlerEvent) => {
  if(event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Check if there's any body to process (ensure body contains ZIP file)
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No file uploaded' }),
      };
    }

    // Decode the base64-encoded body (Netlify functions receive files as base64 strings)
    const zipBuffer = Buffer.from(event.body, 'base64');

    // Unzip and extract files from the ZIP buffer
    const directory = await unzipper.Open.buffer(zipBuffer);

    const fileData: Record<string, string> = {};
    for (const file of directory.files) {
      const content = await file.buffer();
      fileData[file.path] = content.toString('utf-8'); // Convert file content to a string
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'ZIP file processed successfully',
        files: fileData, // This will contain the file names and their content
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: (err as Error).message }),
    };
  }
}