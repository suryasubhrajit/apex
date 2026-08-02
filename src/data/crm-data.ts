export interface OrderItem {
  id: string;
  name: string;
  category: 'Electronics' | 'Apparel' | 'Home' | 'Digital' | 'Hygiene' | 'Final Sale';
  price: number;
  quantity: number;
  condition?: 'Unopened' | 'Opened - Unused' | 'Opened - Used' | 'Damaged on Arrival' | 'Defective';
  isFinalSale?: boolean;
  isAlreadyRefunded?: boolean;
}

export interface Order {
  orderId: string;
  purchaseDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  status: 'Delivered' | 'In Transit' | 'Returned' | 'Processing';
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
  totalAmount: number;
  isAlreadyRefunded?: boolean;
}

export interface CustomerProfile {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  memberTier: 'VIP' | 'Regular' | 'New Member';
  joinDate: string;
  totalOrdersCount: number;
  totalSpent: number;
  priorRefundsCount: number;
  priorRefundsTotal: number;
  riskScore: number; // 0 to 100 (higher = riskier)
  notes: string;
  orders: Order[];
}

export const CRM_DATABASE: CustomerProfile[] = [
  {
    customerId: "CUST-1001",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    memberTier: "VIP",
    joinDate: "2023-01-15",
    totalOrdersCount: 24,
    totalSpent: 3450.00,
    priorRefundsCount: 1,
    priorRefundsTotal: 85.00,
    riskScore: 5,
    notes: "High lifetime value. VIP account holder with priority support.",
    orders: [
      {
        orderId: "ORD-1001",
        purchaseDate: "2026-07-20",
        deliveryDate: "2026-07-24",
        status: "Delivered",
        shippingAddress: "742 Evergreen Terrace, Springfield, OR",
        paymentMethod: "Visa ending in 4242",
        totalAmount: 149.99,
        items: [
          {
            id: "ITEM-801",
            name: "Noise-Canceling Wireless Headphones",
            category: "Electronics",
            price: 149.99,
            quantity: 1,
            condition: "Unopened"
          }
        ]
      },
      {
        orderId: "ORD-980",
        purchaseDate: "2026-05-10",
        deliveryDate: "2026-05-14",
        status: "Delivered",
        shippingAddress: "742 Evergreen Terrace, Springfield, OR",
        paymentMethod: "Visa ending in 4242",
        totalAmount: 89.00,
        items: [
          {
            id: "ITEM-402",
            name: "Merino Wool Sweater",
            category: "Apparel",
            price: 89.00,
            quantity: 1
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1002",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    phone: "+1 (555) 876-5432",
    memberTier: "Regular",
    joinDate: "2024-03-10",
    totalOrdersCount: 5,
    totalSpent: 420.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0.00,
    riskScore: 12,
    notes: "Standard user account, smooth purchase history.",
    orders: [
      {
        orderId: "ORD-1002",
        purchaseDate: "2026-07-25",
        deliveryDate: "2026-07-28",
        status: "Delivered",
        shippingAddress: "123 Market St, San Francisco, CA",
        paymentMethod: "Mastercard ending in 8812",
        totalAmount: 79.50,
        items: [
          {
            id: "ITEM-305",
            name: "Ergonomic Mechanical Keyboard (Tactile)",
            category: "Electronics",
            price: 79.50,
            quantity: 1,
            condition: "Opened - Unused"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1003",
    name: "Elena Rostova",
    email: "elena.r@example.com",
    phone: "+1 (555) 345-6789",
    memberTier: "Regular",
    joinDate: "2023-11-05",
    totalOrdersCount: 8,
    totalSpent: 910.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0.00,
    riskScore: 10,
    notes: "Regular customer requesting refund for item damaged in transit.",
    orders: [
      {
        orderId: "ORD-1003",
        purchaseDate: "2026-07-18",
        deliveryDate: "2026-07-22",
        status: "Delivered",
        shippingAddress: "456 Oak Lane, Seattle, WA",
        paymentMethod: "Apple Pay",
        totalAmount: 185.00,
        items: [
          {
            id: "ITEM-601",
            name: "Handmade Ceramic Coffee Set",
            category: "Home",
            price: 185.00,
            quantity: 1,
            condition: "Damaged on Arrival"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1004",
    name: "David Miller",
    email: "dmiller88@example.com",
    phone: "+1 (555) 901-2345",
    memberTier: "New Member",
    joinDate: "2026-06-01",
    totalOrdersCount: 2,
    totalSpent: 210.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0,
    riskScore: 25,
    notes: "Attempting to return past 30-day window limit (53 days elapsed).",
    orders: [
      {
        orderId: "ORD-1004",
        purchaseDate: "2026-06-05",
        deliveryDate: "2026-06-10",
        status: "Delivered",
        shippingAddress: "88 Pine St, Austin, TX",
        paymentMethod: "Visa ending in 1109",
        totalAmount: 120.00,
        items: [
          {
            id: "ITEM-202",
            name: "Waterproof Hiking Backpack",
            category: "Apparel",
            price: 120.00,
            quantity: 1,
            condition: "Opened - Used"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1005",
    name: "Chloe Bennett",
    email: "chloe.b@example.com",
    phone: "+1 (555) 432-1098",
    memberTier: "Regular",
    joinDate: "2025-02-14",
    totalOrdersCount: 4,
    totalSpent: 350.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0,
    riskScore: 15,
    notes: "Attempting return on Final Sale clearance item.",
    orders: [
      {
        orderId: "ORD-1005",
        purchaseDate: "2026-07-15",
        deliveryDate: "2026-07-19",
        status: "Delivered",
        shippingAddress: "505 Elm St, Denver, CO",
        paymentMethod: "Amex ending in 3004",
        totalAmount: 65.00,
        items: [
          {
            id: "ITEM-999",
            name: "Designer Summer Dress [CLEARANCE FINAL SALE]",
            category: "Final Sale",
            price: 65.00,
            quantity: 1,
            condition: "Unopened",
            isFinalSale: true
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1006",
    name: "Victor Lawson",
    email: "v.lawson@example.com",
    phone: "+1 (555) 678-9012",
    memberTier: "New Member",
    joinDate: "2026-05-20",
    totalOrdersCount: 6,
    totalSpent: 1250.00,
    priorRefundsCount: 4,
    priorRefundsTotal: 980.00,
    riskScore: 88,
    notes: "HIGH RISK ALERTS: 4 refunds out of 6 orders in past 60 days. Potential wardrobing / fraud signal.",
    orders: [
      {
        orderId: "ORD-1006",
        purchaseDate: "2026-07-22",
        deliveryDate: "2026-07-26",
        status: "Delivered",
        shippingAddress: "321 Cedar Rd, Miami, FL",
        paymentMethod: "Discover ending in 7001",
        totalAmount: 299.00,
        items: [
          {
            id: "ITEM-707",
            name: "Smart Fitness Watch Ultra",
            category: "Electronics",
            price: 299.00,
            quantity: 1,
            condition: "Opened - Used"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1007",
    name: "Amanda Chen",
    email: "amanda.chen@example.com",
    phone: "+1 (555) 567-8901",
    memberTier: "VIP",
    joinDate: "2022-09-01",
    totalOrdersCount: 42,
    totalSpent: 6200.00,
    priorRefundsCount: 2,
    priorRefundsTotal: 150.00,
    riskScore: 2,
    notes: "Top VIP tier user. Purchased digital software key by mistake.",
    orders: [
      {
        orderId: "ORD-1007",
        purchaseDate: "2026-07-29",
        deliveryDate: "2026-07-29",
        status: "Delivered",
        shippingAddress: "100 Broadway, New York, NY",
        paymentMethod: "Visa ending in 9988",
        totalAmount: 49.99,
        items: [
          {
            id: "ITEM-DIG-01",
            name: "Photo Editing Suite 2026 License Key",
            category: "Digital",
            price: 49.99,
            quantity: 1
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1008",
    name: "Robert Taylor",
    email: "rtaylor@example.com",
    phone: "+1 (555) 123-9876",
    memberTier: "Regular",
    joinDate: "2024-08-10",
    totalOrdersCount: 9,
    totalSpent: 870.00,
    priorRefundsCount: 1,
    priorRefundsTotal: 45.00,
    riskScore: 18,
    notes: "Opened hygiene product return request.",
    orders: [
      {
        orderId: "ORD-1008",
        purchaseDate: "2026-07-20",
        deliveryDate: "2026-07-23",
        status: "Delivered",
        shippingAddress: "909 Maple Ave, Chicago, IL",
        paymentMethod: "Mastercard ending in 4432",
        totalAmount: 42.00,
        items: [
          {
            id: "ITEM-HYG-05",
            name: "Sonic Electric Toothbrush Head 4-Pack",
            category: "Hygiene",
            price: 42.00,
            quantity: 1,
            condition: "Opened - Used"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1009",
    name: "Sophia Martinez",
    email: "sophia.m@example.com",
    phone: "+1 (555) 789-0123",
    memberTier: "Regular",
    joinDate: "2025-01-20",
    totalOrdersCount: 7,
    totalSpent: 640.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0,
    riskScore: 8,
    notes: "Defective item report within 14 days of delivery.",
    orders: [
      {
        orderId: "ORD-1009",
        purchaseDate: "2026-07-21",
        deliveryDate: "2026-07-25",
        status: "Delivered",
        shippingAddress: "12 Sunset Blvd, Los Angeles, CA",
        paymentMethod: "Visa ending in 6621",
        totalAmount: 110.00,
        items: [
          {
            id: "ITEM-505",
            name: "Cold Press Juicer Machine",
            category: "Home",
            price: 110.00,
            quantity: 1,
            condition: "Defective"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1010",
    name: "James Wilson",
    email: "jwilson@example.com",
    phone: "+1 (555) 321-6549",
    memberTier: "VIP",
    joinDate: "2023-04-12",
    totalOrdersCount: 19,
    totalSpent: 2800.00,
    priorRefundsCount: 1,
    priorRefundsTotal: 60.00,
    riskScore: 6,
    notes: "VIP customer slightly past 30 days (39 days elapsed). Asking for store credit override.",
    orders: [
      {
        orderId: "ORD-1010",
        purchaseDate: "2026-06-20",
        deliveryDate: "2026-06-24",
        status: "Delivered",
        shippingAddress: "404 River Rd, Boston, MA",
        paymentMethod: "Amex ending in 1002",
        totalAmount: 175.00,
        items: [
          {
            id: "ITEM-330",
            name: "Italian Leather Briefcase",
            category: "Apparel",
            price: 175.00,
            quantity: 1,
            condition: "Unopened"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1011",
    name: "Hannah Kim",
    email: "hannah.k@example.com",
    phone: "+1 (555) 654-9870",
    memberTier: "New Member",
    joinDate: "2026-07-01",
    totalOrdersCount: 1,
    totalSpent: 55.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0,
    riskScore: 20,
    notes: "EDGE CASE: Order currently In Transit (delivery date in future 2026-08-05). Cannot return before delivery.",
    orders: [
      {
        orderId: "ORD-1011",
        purchaseDate: "2026-08-01",
        deliveryDate: "2026-08-05",
        status: "In Transit",
        shippingAddress: "55 Main St, Atlanta, GA",
        paymentMethod: "PayPal",
        totalAmount: 55.00,
        items: [
          {
            id: "ITEM-112",
            name: "Aroma Diffuser with Essential Oils",
            category: "Home",
            price: 55.00,
            quantity: 1,
            condition: "Unopened"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1012",
    name: "Ethan Wright",
    email: "ewright@example.com",
    phone: "+1 (555) 987-1234",
    memberTier: "Regular",
    joinDate: "2024-11-15",
    totalOrdersCount: 11,
    totalSpent: 1400.00,
    priorRefundsCount: 1,
    priorRefundsTotal: 110.00,
    riskScore: 14,
    notes: "EDGE CASE: Order was already returned and refunded. Re-requesting duplicate refund.",
    orders: [
      {
        orderId: "ORD-1012",
        purchaseDate: "2026-07-12",
        deliveryDate: "2026-07-16",
        status: "Returned",
        isAlreadyRefunded: true,
        shippingAddress: "777 Highland Ave, Dallas, TX",
        paymentMethod: "Visa ending in 5543",
        totalAmount: 220.00,
        items: [
          {
            id: "ITEM-708",
            name: "Ultra-Wide Gaming Monitor Stand & Arm",
            category: "Electronics",
            price: 220.00,
            quantity: 1,
            condition: "Opened - Unused",
            isAlreadyRefunded: true
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1013",
    name: "Olivia Patel",
    email: "olivia.p@example.com",
    phone: "+1 (555) 234-8901",
    memberTier: "Regular",
    joinDate: "2025-04-18",
    totalOrdersCount: 3,
    totalSpent: 290.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0,
    riskScore: 10,
    notes: "Unopened skincare hygiene set in original seal.",
    orders: [
      {
        orderId: "ORD-1013",
        purchaseDate: "2026-07-24",
        deliveryDate: "2026-07-27",
        status: "Delivered",
        shippingAddress: "123 Peachtree St, Atlanta, GA",
        paymentMethod: "Mastercard ending in 9011",
        totalAmount: 85.00,
        items: [
          {
            id: "ITEM-HYG-09",
            name: "Organic Botanical Skincare Gift Set",
            category: "Hygiene",
            price: 85.00,
            quantity: 1,
            condition: "Unopened"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1014",
    name: "Daniel Jackson",
    email: "djackson@example.com",
    phone: "+1 (555) 890-1234",
    memberTier: "VIP",
    joinDate: "2022-11-30",
    totalOrdersCount: 31,
    totalSpent: 4900.00,
    priorRefundsCount: 2,
    priorRefundsTotal: 210.00,
    riskScore: 4,
    notes: "VIP customer requesting high value refund ($450) due to damaged shipping package.",
    orders: [
      {
        orderId: "ORD-1014",
        purchaseDate: "2026-07-25",
        deliveryDate: "2026-07-28",
        status: "Delivered",
        shippingAddress: "600 Lake Shore Dr, Chicago, IL",
        paymentMethod: "Visa ending in 0019",
        totalAmount: 450.00,
        items: [
          {
            id: "ITEM-SPK-01",
            name: "Audiophile Studio Reference Speakers (Pair)",
            category: "Electronics",
            price: 450.00,
            quantity: 1,
            condition: "Damaged on Arrival"
          }
        ]
      }
    ]
  },
  {
    customerId: "CUST-1015",
    name: "Grace Adams",
    email: "grace.adams@example.com",
    phone: "+1 (555) 456-7890",
    memberTier: "New Member",
    joinDate: "2026-07-10",
    totalOrdersCount: 0,
    totalSpent: 0.00,
    priorRefundsCount: 0,
    priorRefundsTotal: 0,
    riskScore: 10,
    notes: "EDGE CASE: New registered customer with ZERO purchase order history.",
    orders: []
  }
];
