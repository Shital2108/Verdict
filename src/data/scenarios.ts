import { Scenario } from '../types/verdict';

export const SCENARIOS: Record<string, Scenario> = {
  laptop: {
    id: 'laptop',
    title: 'Which laptop should I choose for AI development and daily commuting?',
    badge: 'Hardware Selection',
    contextDescription: 'Evaluating flagship developer workstations balancing machine learning local throughput, all-day battery endurance, and daily commuter transit weight.',
    criteria: [
      {
        id: 'performance',
        name: 'Performance',
        description: 'Multi-threaded compute, neural engine throughput, memory bandwidth',
        min: 0,
        max: 100,
        unit: 'pts',
      },
      {
        id: 'battery',
        name: 'Battery',
        description: 'Real-world unplugged battery life under development workloads',
        min: 0,
        max: 100,
        unit: 'pts',
      },
      {
        id: 'portability',
        name: 'Portability',
        description: 'Chassis weight, thickness, charger compactness, thermal quietness',
        min: 0,
        max: 100,
        unit: 'pts',
      },
    ],
    defaultWeights: {
      performance: 35,
      battery: 45,
      portability: 20,
    },
    options: [
      {
        id: 'laptop-a',
        name: 'Laptop A',
        subtitle: 'Pro Studio 16" (Max Spec)',
        description: 'Peak AI tensor core acceleration, 128GB unified RAM, heavier chassis (2.2kg), aggressive cooling.',
        scores: {
          performance: 92,
          battery: 71,
          portability: 86,
        },
      },
      {
        id: 'laptop-b',
        name: 'Laptop B',
        subtitle: 'Air Precision 14" (Endurance)',
        description: 'Ultra-efficient 3nm architecture, 18-hour real battery, sub-1.4kg weight, balanced dev throughput.',
        scores: {
          performance: 87,
          battery: 94,
          portability: 91,
        },
      },
      {
        id: 'laptop-c',
        name: 'Laptop C',
        subtitle: 'Enterprise Slim 15"',
        description: 'Modular workstation with dual NVMe expansion, solid 14-hour battery, magnesium alloy frame.',
        scores: {
          performance: 84,
          battery: 89,
          portability: 78,
        },
      },
    ],
  },
  apartment: {
    id: 'apartment',
    title: 'Which apartment should I lease for hybrid work and city commute?',
    badge: 'Housing Decision',
    contextDescription: 'Balancing monthly rent budget, door-to-office transit time, and dedicated home office square footage.',
    criteria: [
      {
        id: 'rent',
        name: 'Rent & Value',
        description: 'Monthly lease cost, utility inclusions, fee-to-space ratio',
        min: 0,
        max: 100,
        unit: 'pts',
      },
      {
        id: 'commute',
        name: 'Commute Ease',
        description: 'Transit proximity, door-to-desk duration, express train access',
        min: 0,
        max: 100,
        unit: 'pts',
      },
      {
        id: 'space',
        name: 'Space & Layout',
        description: 'Dedicated workspace nook, natural light, quiet acoustic rating',
        min: 0,
        max: 100,
        unit: 'pts',
      },
    ],
    defaultWeights: {
      rent: 40,
      commute: 35,
      space: 25,
    },
    options: [
      {
        id: 'apt-downtown',
        name: 'Downtown Loft',
        subtitle: 'Financial District Core',
        description: '10-minute walk to headquarters, compact 520 sq ft, premium rent tier ($3,400/mo).',
        scores: {
          rent: 68,
          commute: 96,
          space: 72,
        },
      },
      {
        id: 'apt-midtown',
        name: 'Midtown Flat',
        subtitle: 'Arts & Cultural District',
        description: '22-minute direct express subway, 780 sq ft 1-bed with dedicated den, balanced rent ($2,850/mo).',
        scores: {
          rent: 86,
          commute: 84,
          space: 82,
        },
      },
      {
        id: 'apt-parkside',
        name: 'Parkside Suite',
        subtitle: 'Quiet Urban Perimeter',
        description: '45-minute commuter rail, spacious 1,050 sq ft 2-bed, exceptional price ($2,300/mo).',
        scores: {
          rent: 95,
          commute: 58,
          space: 94,
        },
      },
    ],
  },
};
