export const seedFirestore = async () => {
  console.log('Seeding is disabled in production build.');
  return false;
};

export const seedAllData = seedFirestore;
