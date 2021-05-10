import sharp from "sharp";
interface AvatarProcessorProps {
  avatar: Buffer;
  quality?: number;
}

async function avatarProcessor({ avatar, quality }: AvatarProcessorProps) {
  const newImage = await sharp(avatar)
    .resize(600, 600, { fastShrinkOnLoad: true })
    .jpeg({ force: false, mozjpeg: true, quality, progressive: true })
    .toBuffer();

  return newImage;
}

export { avatarProcessor };
