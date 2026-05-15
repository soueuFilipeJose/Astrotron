const Utils = {
  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt(min, max) {
    return Math.floor(Utils.randomRange(min, max + 1));
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  },

  wrap(entity, width, height) {
    const margin = entity.radius || 0;

    if (entity.x < -margin) entity.x = width + margin;
    if (entity.x > width + margin) entity.x = -margin;
    if (entity.y < -margin) entity.y = height + margin;
    if (entity.y > height + margin) entity.y = -margin;
  },

  circleCollision(a, b) {
    return Utils.distance(a, b) < a.radius + b.radius;
  },

  formatScore(value) {
    return String(Math.max(0, Math.floor(value))).padStart(5, "0");
  }
};
