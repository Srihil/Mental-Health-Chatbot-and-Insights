const images = import.meta.glob("./*.png", { eager: true });

const avatarMap = {};
Object.entries(images).forEach(([path, mod]) => {
  const fileName = path.split("/").pop().replace(".png", "");
  avatarMap[fileName] = mod.default;
});

export default avatarMap;
