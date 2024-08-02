import { randInt } from "./number";

export const generateNickname = (name: string) => {
  const clearName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "");

  const randomID = randInt(0, 999999);
  const generatedNickname = `${clearName}_${randomID}`

  return generatedNickname;
};
