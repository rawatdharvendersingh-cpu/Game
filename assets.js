// Realistic Game Assets Loader
const ASSETS = {
  bgRooftop: new Image(),
  bgStreet: new Image(),
  heroSprites: new Image(),
  enemySprites: new Image(),
  gunPickup: new Image(),
  isLoaded: false
};

const ASSET_PATHS = {
  bgRooftop: 'C:/Users/admin/.gemini/antigravity-ide/brain/418967b3-2d3a-4310-b006-1d9b47066d7b/realistic_rooftop_background_1791795901499.jpg',
  bgStreet: 'C:/Users/admin/.gemini/antigravity-ide/brain/418967b3-2d3a-4310-b006-1d9b47066d7b/realistic_street_background_1791795932204.jpg',
  heroSprites: 'C:/Users/admin/.gemini/antigravity-ide/brain/418967b3-2d3a-4310-b006-1d9b47066d7b/realistic_hero_sprites_1791795957390.jpg',
  enemySprites: 'C:/Users/admin/.gemini/antigravity-ide/brain/418967b3-2d3a-4310-b006-1d9b47066d7b/realistic_enemy_sprites_1791795984741.jpg',
  gunPickup: 'C:/Users/admin/.gemini/antigravity-ide/brain/418967b3-2d3a-4310-b006-1d9b47066d7b/weapon_gun_pickup_1791796010310.jpg'
};

function loadAllAssets(onComplete) {
  let toLoad = Object.keys(ASSET_PATHS).length;
  let loaded = 0;

  const check = () => {
    loaded++;
    if (loaded >= toLoad) {
      ASSETS.isLoaded = true;
      if (onComplete) onComplete();
    }
  };

  for (let key in ASSET_PATHS) {
    ASSETS[key].crossOrigin = 'anonymous';
    ASSETS[key].onload = check;
    ASSETS[key].onerror = () => {
      console.warn('Could not load asset:', key, ASSET_PATHS[key]);
      check();
    };
    ASSETS[key].src = ASSET_PATHS[key];
  }
}
