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
        chromaSubsampling: "4:4:4",
        progressive: true,
        quality: quality,
      })
      .toBuffer();

    return newImage
  }

  async image({ image, quality }: ImageProcessorProps) {
    const newImage = await sharp(image)
      .jpeg({
        force: false,
        mozjpeg: true,
        quality: quality || 90,
        progressive: true,
      })
      .toBuffer();

    return newImage;
  }
}

export { ImageProcessor };
