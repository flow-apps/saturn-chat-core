export function clearFilename(name: string) {
  let newName = name.toLowerCase().trim().normalize("NFD");

  if (newName.length >= 255) {
    newName = newName.slice(newName.length - 20);
  }

  return newName.replace(/[^a-zA-Z0-9\-\_\(\)\.]/gi, "");
}
