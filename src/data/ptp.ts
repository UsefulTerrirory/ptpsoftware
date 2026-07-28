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
    id: 'ice-balls',
    name: 'Ice Balls',
    short: 'IB',
    category: "Ice cream that'll make you forget",
    accent: '#7DD3FC',
    glow: '#C084FC',
    rating: 4.9,
    eta: '2 min',
    menu: [
      {
        id: 'vanilla',
        name: 'Vanilla',
        description: 'Classic creamy vanilla ice cream.',
        price: 4.99,
        image: images.pastry,
        tag: 'Classic',
      },
      {
        id: 'chocolate',
        name: 'Chocolate',
        description: 'Rich Belgian chocolate ice cream.',
        price: 5.49,
        image: images.pastry,
        tag: 'Popular',
      },
      {
        id: 'strawberry',
        name: 'Strawberry',
        description: 'Fresh strawberry ice cream.',
        price: 5.29,
        image: images.pastry,
        tag: 'Fresh',
      },
      {
        id: 'mint-chip',
        name: 'Mint Chocolate Chip',
        description: 'Refreshing mint ice cream with chocolate chips.',
        price: 5.99,
        image: images.pastry,
        tag: 'Refreshing',
      },
      {
        id: 'cookies-cream',
        name: 'Cookies & Cream',
        description: 'Vanilla ice cream with chocolate cookie pieces.',
        price: 5.99,
        image: images.pastry,
        tag: 'Fan Favorite',
      },
      {
        id: 'salted-caramel',
        name: 'Salted Caramel',
        description: 'Creamy caramel with a touch of sea salt.',
        price: 6.49,
        image: images.pastry,
        tag: 'Premium',
      },
      {
        id: 'mango',
        name: 'Mango',
        description: 'Sweet tropical mango ice cream.',
        price: 5.49,
        image: images.pastry,
        tag: 'Summer',
      },
      {
        id: 'pistachio',
        name: 'Pistachio',
        description: 'Roasted pistachio ice cream.',
        price: 6.99,
        image: images.pastry,
        tag: 'Signature',
      },
    ],
  },
]

export const demoTokens = [
  { token: 'PTP-ICE-7K2M-4Q7X', productId: 'vanilla', serial: 'IB-0000001' },
  { token: 'PTP-ICE-3V9L-7C2P', productId: 'chocolate', serial: 'IB-0000002' },
  { token: 'PTP-ICE-6D4R-1W8N', productId: 'strawberry', serial: 'IB-0000003' },
]

export const findProduct = (productId: string) => {
  for (const restaurant of restaurants) {
    const product = restaurant.menu.find((item) => item.id === productId)
    if (product) return { restaurant, product }
  }
  return null
}
