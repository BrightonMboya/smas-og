import { array } from "fast-web-kit";

// Define different tourism seasons
export const tourismSeasons: string[] = array.sort(
    [
        "low",   // Off-peak tourist season
        "peak",  // Peak tourist season
        "high",  // High tourist season
    ],
    "asc"       // Sort the seasons in ascending order
);

// Function to transform hotel data
export const transformHotelData = (hotels: any[]): any [] => {
    return hotels.reduce((result, hotel) => {
        const {
            NAME,
            CATEGORY,
            PHONE,
            EMAIL,
            WEBSITE,
            REGION,
            'ROOM TYPE': roomType,
            LOW,
            HIGH,
            PEAK
        } = hotel;

        // Split price strings into components
        const [lowSTO, lowRackRate] = LOW.split('/');
        const [highSTO, highRackRate] = HIGH.split('/');
        const [peakSTO, peakRackRate] = PEAK.split('/');

        // Find an existing hotel with the same name (case insensitive)
        const existingHotel = result.find((h: any) => h.name.toLowerCase() === NAME.toLowerCase());

        if (existingHotel) {
            // Add a new room to the existing hotel
            existingHotel.rooms.push({
                type: roomType,
                prices: {
                    low: {
                        sto: Number(lowSTO),
                        rack_rate: Number(lowRackRate)
                    },
                    high: {
                        sto: Number(highSTO),
                        rack_rate: Number(highRackRate)
                    },
                    peak: {
                        sto: Number(peakSTO),
                        rack_rate: Number(peakRackRate)
                    }
                }
            });
        } else {
            // Create a new hotel object
            result.push({
                name: NAME.toLowerCase(),
                category: CATEGORY,
                address: {
                    country: 'tanzania',
                    region: REGION?.toLowerCase() || "" // Default to an empty string if REGION is undefined
                },
                contacts: {
                    email: EMAIL,
                    website: WEBSITE,
                    phone_number: PHONE.toString()
                },
                rooms: [
                    {
                        type: roomType,
                        prices: {
                            low: {
                                sto: Number(lowSTO),
                                rack_rate: Number(lowRackRate)
                            },
                            high: {
                                sto: Number(highSTO),
                                rack_rate: Number(highRackRate)
                            },
                            peak: {
                                sto: Number(peakSTO),
                                rack_rate: Number(peakRackRate)
                            }
                        }
                    }
                ]
            });
        }

        return result;
    }, []);
}

// Function to transform the data back to its original format
export const transformToOriginalFormat = (hotels: any[]) => {
    const originalArray: any[] = [];

    hotels.forEach((hotel) => {
        hotel.rooms.forEach((room: any) => {
            // Find the original hotel object
            const originalHotel = originalArray.find((h) => h.NAME === hotel.name);

            if (originalHotel) {
                // Create a new room object and add it to the original hotel
                const newRoom = {
                    ...originalHotel,
                    'ROOM TYPE': room.type,
                    LOW: `${room.prices.low.sto}/${room.prices.low.rack_rate}`,
                    HIGH: `${room.prices.high.sto}/${room.prices.high.rack_rate}`,
                    PEAK: `${room.prices.peak.sto}/${room.prices.peak.rack_rate}`,
                };

                originalArray.push(newRoom);
            } else {
                // Create a new hotel object and add it to the original array
                const originalHotelObj = {
                    NAME: hotel.name,
                    CATEGORY: hotel.category,
                    PHONE: parseInt(hotel.contacts.phone_number, 10),
                    EMAIL: hotel.contacts.email,
                    WEBSITE: hotel.contacts.website,
                    REGION: hotel.address.region?.toLowerCase() || "",
                    'ROOM TYPE': room.type,
                    LOW: `${room.prices.low.sto}/${room.prices.low.rack_rate}`,
                    HIGH: `${room.prices.high.sto}/${room.prices.high.rack_rate}`,
                    PEAK: `${room.prices.peak.sto}/${room.prices.peak.rack_rate}`,
                };

                originalArray.push(originalHotelObj);
            }
        });
    });

    return originalArray;
}
