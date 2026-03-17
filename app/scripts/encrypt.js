import bcrypt from "bcryptjs";

async function generateHashedPassword() {
  const plainPassword = "h5TRg-ap52ha-na98a";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  console.log("Hashed Password:", hashedPassword);
}

generateHashedPassword();
