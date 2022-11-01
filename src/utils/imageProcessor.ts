import sharp from "sharp";

interface AvatarProcessorProps {
  avatar: Buffer;
  quality?: number;
}

interface ImageProcessorProps {
  image: Buffer;
  quality?: number;
}

class ImageProcessor {
  async avatar({ avatar, quality = 90 }: AvatarProcessorProps) {
    const newImage = await sharp(avatar)
      .resize(600, 600, { fastShrinkOnLoad: true })
      .jpeg({
        mozjpeg: true,
        force: true,
        chromaSubsampling: quality <= 90 ? "4:4:4" : "4:2:0",
        progressive: true,
        quality: quality,
      })
      .toBuffer();

    return newImage
  }

  async image({ image, quality = 90 }: ImageProcessorProps) {
    const newImage = await sharp(image)
      .jpeg({
        force: false,
        quality: quality,
        chromaSubsampling: quality <= 90 ? "4:4:4" : "4:2:0",
      })
      .withMetadata()
      .toBuffer();

    return newImage;
  }
}

export { ImageProcessor };
