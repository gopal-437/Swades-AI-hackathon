export interface OPFSChunk {
  id: string;
  blob: Blob;
}

export async function saveChunkToOPFS(id: string, blob: Blob): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(id, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    console.error("Failed to save chunk to OPFS:", error);
  }
}

export async function getOPFSChunks(): Promise<string[]> {
  try {
    const root = await navigator.storage.getDirectory();
    const chunkIds: string[] = [];
    // @ts-expect-error - entries() is not fully typed in some older TS versions, but it works in modern browsers
    for await (const [name, handle] of root.entries()) {
      if (handle.kind === "file") {
        chunkIds.push(name);
      }
    }
    return chunkIds;
  } catch (error) {
    console.error("Failed to get OPFS chunks:", error);
    return [];
  }
}

export async function getChunkFromOPFS(id: string): Promise<Blob | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(id);
    const file = await handle.getFile();
    return file;
  } catch (error) {
    console.error("Failed to read chunk from OPFS:", error);
    return null;
  }
}

export async function deleteChunkFromOPFS(id: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(id);
  } catch (error) {
    console.error("Failed to delete chunk from OPFS:", error);
  }
}

export async function clearAllChunksFromOPFS(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    // @ts-expect-error
    for await (const [name, handle] of root.entries()) {
      if (handle.kind === "file") {
        await root.removeEntry(name);
      }
    }
  } catch (error) {
    console.error("Failed to clear OPFS chunks:", error);
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        // Strip the data:audio/wav;base64, prefix
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data ?? reader.result);
      } else {
        reject(new Error("Failed to convert to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
