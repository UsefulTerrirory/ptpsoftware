export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image: string
  tag: string
}

export type Restaurant = {
  id: string
  name: string
  short: string
  category: string
  accent: string
  glow: string
  rating: number
  eta: string
  menu: MenuItem[]
}

const images = {
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
  pizza: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85',
  bowl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=85',
  noodles: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=85',
  taco: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=900&q=85',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85',
  pastry: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85',
  chicken: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85',
}

export const restaurants: Restaurant[] = [
  {
    id: 'nova-bites', name: 'NovaBites', short: 'NB', category: 'Cosmic comfort food', accent: '#ff6b35', glow: '#ffb347', rating: 4.9, eta: '8 min',
    menu: [
      { id: 'nova-crunch-burger', name: 'Nova Crunch Burger', description: 'Smashed beef, meteor sauce, crispy shallots', price: 12.8, image: images.burger, tag: 'Bestseller' },
      { id: 'supernova-tenders', name: 'Supernova Tenders', description: 'Hot honey glaze with cooling ranch dust', price: 10.5, image: images.chicken, tag: 'Spicy' },
      { id: 'lunar-club', name: 'Lunar Club', description: 'Roasted turkey, avocado, smoked aioli', price: 11.2, image: images.sandwich, tag: 'Fresh' },
      { id: 'gravity-greens', name: 'Gravity Greens', description: 'Kale, grains, citrus and toasted seeds', price: 9.4, image: images.salad, tag: 'Plant-powered' },
    ],
  },
  {
    id: 'pixel-pizza', name: 'PixelPizza', short: 'PP', category: 'Next-gen pizza lab', accent: '#ff3d9a', glow: '#8b5cf6', rating: 4.8, eta: '12 min',
    menu: [
      { id: 'eight-bit-pepperoni', name: '8-Bit Pepperoni', description: 'Cupped pepperoni, hot honey and pecorino', price: 14.75, image: images.pizza, tag: 'Iconic' },
      { id: 'glitch-garden', name: 'Glitch Garden', description: 'Charred peppers, mushroom and basil pixels', price: 13.5, image: images.pizza, tag: 'Vegetarian' },
      { id: 'rendered-ricotta', name: 'Rendered Ricotta', description: 'Whipped ricotta, lemon zest and chili oil', price: 15.25, image: images.pizza, tag: 'New' },
      { id: 'binary-bianca', name: 'Binary Bianca', description: 'Mozzarella, garlic cream and rosemary', price: 13.95, image: images.pizza, tag: 'Creamy' },
    ],
  },
  {
    id: 'orbit-burgers', name: 'Orbit Burgers', short: 'OB', category: 'Burgers in motion', accent: '#6c5ce7', glow: '#00d2ff', rating: 4.7, eta: '10 min',
    menu: [
      { id: 'orbital-double', name: 'Orbital Double', description: 'Two patties, orbit onions and plasma pickles', price: 13.6, image: images.burger, tag: 'Classic' },
      { id: 'apogee-chicken', name: 'Apogee Chicken', description: 'Crispy chicken, slaw and comet pepper mayo', price: 11.9, image: images.chicken, tag: 'Crunchy' },
      { id: 'zero-g-shroom', name: 'Zero-G Shroom', description: 'Portobello, provolone and truffle orbit sauce', price: 12.4, image: images.burger, tag: 'Vegetarian' },
      { id: 'satellite-stack', name: 'Satellite Stack', description: 'Breakfast burger with egg and hash crisp', price: 14.2, image: images.burger, tag: 'All day' },
    ],
  },
  {
    id: 'cloud-kitchen', name: 'Cloud Kitchen Co.', short: 'CK', category: 'Elevated everyday bowls', accent: '#00b894', glow: '#81ecec', rating: 4.9, eta: '7 min',
    menu: [
      { id: 'cirrus-chicken', name: 'Cirrus Chicken Bowl', description: 'Herb chicken, farro, greens and cloud tahini', price: 12.25, image: images.bowl, tag: 'Balanced' },
      { id: 'cumulus-curry', name: 'Cumulus Curry', description: 'Coconut curry, roasted squash and jasmine rice', price: 11.75, image: images.bowl, tag: 'Vegan' },
      { id: 'skyline-salad', name: 'Skyline Salad', description: 'Avocado, feta, cucumber and mint vinaigrette', price: 10.8, image: images.salad, tag: 'Fresh' },
      { id: 'misty-melt', name: 'Misty Melt', description: 'Three cheeses, sourdough and tomato cloud dip', price: 9.95, image: images.sandwich, tag: 'Comfort' },
    ],
  },
  {
    id: 'solar-sushi', name: 'Solar Sushi', short: 'SS', category: 'Bright Japanese craft', accent: '#f7b731', glow: '#ff6b6b', rating: 4.8, eta: '14 min',
    menu: [
      { id: 'sunflare-roll', name: 'Sunflare Roll', description: 'Salmon, mango, avocado and yuzu ember', price: 15.8, image: images.sushi, tag: 'Signature' },
      { id: 'eclipse-box', name: 'Eclipse Bento', description: 'Miso cod, rice, pickles and sesame greens', price: 17.5, image: images.sushi, tag: 'Complete meal' },
      { id: 'helios-crunch', name: 'Helios Crunch', description: 'Tempura shrimp, spicy tuna and crispy leek', price: 16.4, image: images.sushi, tag: 'Crunchy' },
      { id: 'zenith-veggie', name: 'Zenith Veggie Roll', description: 'Asparagus, cucumber, tofu and ume glaze', price: 12.6, image: images.sushi, tag: 'Vegan' },
    ],
  },
  {
    id: 'neon-noodles', name: 'Neon Noodles', short: 'NN', category: 'Electric street noodles', accent: '#00e5ff', glow: '#a3ff12', rating: 4.7, eta: '9 min',
    menu: [
      { id: 'electric-dan-dan', name: 'Electric Dan Dan', description: 'Sesame chili noodles, pork and neon herbs', price: 12.9, image: images.noodles, tag: 'Fan favorite' },
      { id: 'ultraviolet-udon', name: 'Ultraviolet Udon', description: 'Black garlic broth, mushrooms and jammy egg', price: 13.75, image: images.noodles, tag: 'Umami' },
      { id: 'laser-laksa', name: 'Laser Laksa', description: 'Coconut curry broth, shrimp and rice noodles', price: 14.6, image: images.noodles, tag: 'Spicy' },
      { id: 'limewire-lo-mein', name: 'Limewire Lo Mein', description: 'Wok vegetables, ginger lime and tofu', price: 11.8, image: images.noodles, tag: 'Vegan' },
    ],
  },
  {
    id: 'galaxy-grill', name: 'Galaxy Grill', short: 'GG', category: 'Open-fire favorites', accent: '#fdcb6e', glow: '#e17055', rating: 4.9, eta: '15 min',
    menu: [
      { id: 'milky-way-steak', name: 'Milky Way Steak Box', description: 'Grilled steak, chimichurri and ember potatoes', price: 19.8, image: images.bowl, tag: 'Premium' },
      { id: 'cosmic-chicken', name: 'Cosmic Fire Chicken', description: 'Half chicken, citrus glaze and charred corn', price: 16.9, image: images.chicken, tag: 'Fire grilled' },
      { id: 'asteroid-tacos', name: 'Asteroid Tacos', description: 'Smoked brisket, salsa roja and onion', price: 13.4, image: images.taco, tag: 'Three pack' },
      { id: 'starlight-sandwich', name: 'Starlight Sandwich', description: 'Grilled halloumi, peppers and herb pesto', price: 12.7, image: images.sandwich, tag: 'Vegetarian' },
    ],
  },
]

export const demoTokens = [
  { token: 'PTP-NOVA-8K2M-4Q7X', productId: 'nova-crunch-burger', serial: 'NB-0001842' },
  { token: 'PTP-SOLAR-3V9L-7C2P', productId: 'sunflare-roll', serial: 'SS-0000921' },
  { token: 'PTP-NEON-6D4R-1W8N', productId: 'electric-dan-dan', serial: 'NN-0003357' },
]

export const findProduct = (productId: string) => {
  for (const restaurant of restaurants) {
    const product = restaurant.menu.find((item) => item.id === productId)
    if (product) return { restaurant, product }
  }
  return null
}
