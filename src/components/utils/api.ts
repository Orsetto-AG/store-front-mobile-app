const mockApiResponse = <T>(data: T): Promise<{ data: T }> => new Promise((resolve) => setTimeout(() => resolve({ data }), 1000));

const api = {
    getCategories: () => mockApiResponse([
        { id: 1, name: 'Elektronik', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        { id: 2, name: 'Moda', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        { id: 3, name: 'Bakim', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        { id: 4, name: 'Kitap', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        { id: 5, name: 'Bicak', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        { id: 6, name: 'Araba', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        { id: 7, name: 'Tablo', image: 'https://images.hepsiburada.net/banners/s/1/180-180/elektronik-jenerik-tr_(2)133803740522905919.png/format:webp' },
        // Add more mock categories
    ]),
    getRecommended: () => mockApiResponse([
        {
            id: 11,
            name: 'iPhone 24',
            image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
            images: [
                'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
                'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
                'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
            ],
            media: [
                { type: 'image', uri: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg' },
                { type: 'image', uri: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg' },
                { type: 'video', uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
            ],
            rating: 4.5,
            price: '50.000',
        },
        { id: 22, name: 'iPhone 14', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.5, price: '50.000' },
        { id: 33, name: 'iPhone 14', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.5, price: '50.000' },
        { id: 44, name: 'iPhone 14', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.5, price: '50.000' },
        { id: 55, name: 'iPhone 14', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.5, price: '50.000' },
        // Add more mock products
    ]),

    getBestSellers: () => mockApiResponse([
        { id: 16, name: 'Samsung Galaxy', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.8, price: '40.000' },
        { id: 72, name: 'Samsung Galaxy', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.8, price: '40.000' },
        { id: 38, name: 'Samsung Galaxy', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.8, price: '40.000' },
        { id: 94, name: 'Samsung Galaxy', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.8, price: '40.000' },
        { id: 85, name: 'Samsung Galaxy', image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg', rating: 4.8, price: '40.000' },

        // Add more mock products
    ]),
    getCategoryProducts: (categoryId: number) => mockApiResponse([
        {
            id: 1,
            name: `Product ${categoryId}-1`,
            image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
            rating: 4.5,
            price: '10,000',
            listedDate: '2025-01-07T12:00:00Z', // Listed within 3 days
            expirationDate: '2025-01-15T12:00:00Z', // Valid for 8 days
            bids: [
                { amount: 11000, bidder: 'User1' },
                { amount: 14000, bidder: 'User2' },
            ], // Multiple bids
            isSold: false, // Not sold
        },
        {
            id: 2,
            name: `Product ${categoryId}-2`,
            image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
            rating: 4.0,
            price: '8,000',
            listedDate: '2025-01-01T10:00:00Z', // Older listing
            expirationDate: '2025-01-15T12:00:00Z',
            bids: [], // No bids
            isSold: false, // Expired but not sold
        },
        {
            id: 3,
            name: `Product ${categoryId}-3`,
            image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
            rating: 4.7,
            price: '15,000',
            listedDate: '2025-01-07T09:00:00Z', // Recent listing
            expirationDate: '2025-01-08T12:00:00Z', // Less than 24 hours left
            bids: [], // No bids
            isSold: false, // Not sold, still valid
        },
        {
            id: 4,
            name: `Product ${categoryId}-4`,
            image: 'https://productimages.hepsiburada.net/s/473/375-375/110000516217504.jpg',
            rating: 4.8,
            price: '12,000',
            listedDate: '2025-01-02T09:00:00Z', // Older listing
            expirationDate: '2025-01-05T12:00:00Z', // Expired
            bids: [{ amount: 13000, bidder: 'User3' }], // One bid
            isSold: true, // Sold
        },
    ]),
};

export default api;
