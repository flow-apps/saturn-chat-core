import Jimp from "jimp";

async function imageProcessor(image: any) {
  const processedImage = await Jimp.read(Buffer.from(image, "base64")).then(
    async (image) => {
      image.resize(600, 600).quality(70);
      return image.getBufferAsync(image.getMIME());
    }
  );

  return processedImage;
}

export { imageProcessor };
