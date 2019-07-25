import { Buffer } from "../net/Buffer";
import { BZip2Decompressor } from "./bzip/BZip2Decompressor";
import { rs_hash_string } from "./../../wasm/Cargo.toml";

/**
 * Creates the archive.
 *
 * @param {Array} dataBuffer The buffer of the archive.
 * @class
 */
export class Archive {
  public archiveBuffer: number[];

  public dataSize: number;

  public nameHashes: number[];

  public uncompressedSizes: number[];

  public compressedSizes: number[];

  public startOffsets: number[];

  public compressed: boolean;

  public constructor(dataBuffer: number[]) {
    if (this.archiveBuffer === undefined) {
      this.archiveBuffer = null;
    }
    if (this.dataSize === undefined) {
      this.dataSize = 0;
    }
    if (this.nameHashes === undefined) {
      this.nameHashes = null;
    }
    if (this.uncompressedSizes === undefined) {
      this.uncompressedSizes = null;
    }
    if (this.compressedSizes === undefined) {
      this.compressedSizes = null;
    }
    if (this.startOffsets === undefined) {
      this.startOffsets = null;
    }
    if (this.compressed === undefined) {
      this.compressed = false;
    }
    let buffer: Buffer = new Buffer(dataBuffer);
    const uncompressed: number = buffer.get24BitInt();
    const compressed: number = buffer.get24BitInt();
    if (compressed !== uncompressed) {
      const data: number[] = (s => {
        const a = [];
        while (s-- > 0) {
          a.push(0);
        }
        return a;
      })(uncompressed);
      BZip2Decompressor.decompress$byte_A$int$byte_A$int$int(
        data,
        uncompressed,
        dataBuffer,
        compressed,
        6
      );
      this.archiveBuffer = data;
      buffer = new Buffer(this.archiveBuffer);
      this.compressed = true;
    } else {
      this.archiveBuffer = dataBuffer;
      this.compressed = false;
    }
    this.dataSize = buffer.getUnsignedLEShort();
    this.nameHashes = (s => {
      const a = [];
      while (s-- > 0) {
        a.push(0);
      }
      return a;
    })(this.dataSize);
    this.uncompressedSizes = (s => {
      const a = [];
      while (s-- > 0) {
        a.push(0);
      }
      return a;
    })(this.dataSize);
    this.compressedSizes = (s => {
      const a = [];
      while (s-- > 0) {
        a.push(0);
      }
      return a;
    })(this.dataSize);
    this.startOffsets = (s => {
      const a = [];
      while (s-- > 0) {
        a.push(0);
      }
      return a;
    })(this.dataSize);
    let offset: number = buffer.currentPosition + this.dataSize * 10;
    for (let index: number = 0; index < this.dataSize; index++) {
      {
        this.nameHashes[index] = buffer.getInt();
        this.uncompressedSizes[index] = buffer.get24BitInt();
        this.compressedSizes[index] = buffer.get24BitInt();
        this.startOffsets[index] = offset;
        offset += this.compressedSizes[index];
      }
    }
  }

  /**
   * Gets a file by its name.
   *
   * @param {string} file The file name.
   * @return {Array} The file contents.
   */
  public getFile(file: string): number[] {
    let dataBuffer: number[] = null;
    file = file.toUpperCase();
    const hash = rs_hash_string(file);
    for (let index: number = 0; index < this.dataSize; index++) {
      {
        if (this.nameHashes[index] === hash) {
          if (dataBuffer == null) {
            dataBuffer = (s => {
              const a = [];
              while (s-- > 0) {
                a.push(0);
              }
              return a;
            })(this.uncompressedSizes[index]);
          }
          if (!this.compressed) {
            BZip2Decompressor.decompress$byte_A$int$byte_A$int$int(
              dataBuffer,
              this.uncompressedSizes[index],
              this.archiveBuffer,
              this.compressedSizes[index],
              this.startOffsets[index]
            );
          } else {
            for (
              let pos: number = 0;
              pos < this.uncompressedSizes[index];
              pos++
            ) {
              dataBuffer[pos] = this.archiveBuffer[
                this.startOffsets[index] + pos
              ];
            }
          }
          return dataBuffer;
        }
      }
    }
    return null;
  }
}
