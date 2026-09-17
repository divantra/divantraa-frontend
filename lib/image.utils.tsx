export const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) {
    return path;
  }
  return `${process.env.NEXT_PUBLIC_IMAGE_URL}${path}`;
};
