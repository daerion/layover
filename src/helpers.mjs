import config from 'config'
import sharp from 'sharp'

export const createScaledImage = async (input, output, overlay = config.get('overlay'), size = config.get('imageSize')) => {
  const logo = sharp(overlay.image).resize(overlay.size)
  const image = sharp(input)
  const position = sharp.gravity[overlay.position]

  await image
    .resize(size)
    .overlayWith(await logo.toBuffer(), { gravity: position })
    .toFile(output)

  return image
}
