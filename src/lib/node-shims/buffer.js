// Minimal Buffer compatible with avsc's Tap/Type in the browser.
// Only the methods avsc actually calls — not a full Node Buffer.

export class Buffer extends Uint8Array {
  static alloc(size) {
    return new Buffer(size);
  }

  static allocUnsafeSlow(size) {
    return new Buffer(size);
  }

  static from(data, enc) {
    if (data instanceof Buffer) return data;
    if (typeof data === 'string') {
      if (enc === 'binary' || enc === 'latin1') {
        const out = new Buffer(data.length);
        for (let i = 0; i < data.length; i += 1) out[i] = data.charCodeAt(i) & 0xff;
        return out;
      }
      return Buffer.from(new TextEncoder().encode(data));
    }
    if (data instanceof ArrayBuffer) return new Buffer(data);
    if (ArrayBuffer.isView(data)) {
      const out = new Buffer(data.byteLength);
      out.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      return out;
    }
    if (Array.isArray(data)) return new Buffer(Uint8Array.from(data).buffer);
    return new Buffer(0);
  }

  static concat(list, totalLength) {
    const len = totalLength ?? list.reduce((n, item) => n + item.length, 0);
    const out = new Buffer(len);
    let offset = 0;
    for (const item of list) {
      out.set(item, offset);
      offset += item.length;
    }
    return out;
  }

  static isBuffer(value) {
    return value instanceof Buffer;
  }

  static byteLength(str, enc) {
    if (typeof str !== 'string') return str?.length || 0;
    if (enc === 'binary' || enc === 'latin1') return str.length;
    return new TextEncoder().encode(str).length;
  }

  slice(start, end) {
    return Buffer.from(Uint8Array.prototype.slice.call(this, start, end));
  }

  copy(target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
    const length = Math.max(0, sourceEnd - sourceStart);
    for (let i = 0; i < length; i += 1) {
      target[targetStart + i] = this[sourceStart + i];
    }
    return length;
  }

  equals(other) {
    if (!other || this.length !== other.length) return false;
    for (let i = 0; i < this.length; i += 1) {
      if (this[i] !== other[i]) return false;
    }
    return true;
  }

  toString(enc) {
    if (enc === 'binary' || enc === 'latin1') {
      let text = '';
      for (let i = 0; i < this.length; i += 1) text += String.fromCharCode(this[i]);
      return text;
    }
    return new TextDecoder().decode(this);
  }

  readFloatLE(offset) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset, true);
  }

  writeFloatLE(value, offset) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value, true);
    return offset + 4;
  }

  readDoubleLE(offset) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset, true);
  }

  writeDoubleLE(value, offset) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value, true);
    return offset + 8;
  }

  writeIntLE(value, offset, byteLength) {
    const view = new DataView(this.buffer, this.byteOffset, this.byteLength);
    if (byteLength === 4) view.setInt32(offset, value, true);
    else if (byteLength === 2) view.setInt16(offset, value, true);
    else if (byteLength === 1) this[offset] = value;
    else {
      let remaining = value;
      for (let i = 0; i < byteLength; i += 1) {
        this[offset + i] = remaining & 0xff;
        remaining /= 256;
      }
    }
    return offset + byteLength;
  }

  write(str, offset, length, encoding) {
    const bytes = Buffer.from(str, encoding === 'binary' ? 'latin1' : encoding);
    const count = Math.min(length ?? bytes.length, bytes.length);
    this.set(bytes.subarray(0, count), offset || 0);
    return count;
  }
}

export default { Buffer };
