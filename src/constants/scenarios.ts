/**
 * Scenario names for the language learning app
 * 30 scenarios covering various real-world situations
 */

export const SCENARIO_NAMES: Record<number, string> = {
  1: "Social greetings and introductions",
  2: "Casual conversations with friends or acquaintances",
  3: "Family gatherings and discussions",
  4: "Dating and romantic interactions",
  5: "Professional networking and meetings",
  6: "Job interviews and career advice",
  7: "Workplace collaborations and feedback",
  8: "Academic discussions and lectures",
  9: "Everyday shopping and transactions",
  10: "Dining out and restaurant interactions",
  11: "Travel planning and bookings",
  12: "Airport and transportation logistics",
  13: "Asking for and giving directions",
  14: "Hotel and accommodation arrangements",
  15: "Medical consultations and health advice",
  16: "Emergency situations and help requests",
  17: "Banking and financial discussions",
  18: "Legal consultations and advice",
  19: "Community events and volunteering",
  20: "Sports and fitness activities",
  21: "Hobbies and leisure pursuits",
  22: "Cultural events and arts appreciation",
  23: "Media and entertainment reviews",
  24: "News and current events debates",
  25: "Politics and social issues discussions",
  26: "Environmental and sustainability talks",
  27: "Technology and gadget troubleshooting",
  28: "Customer service and complaints",
  29: "Negotiations and bargaining",
  30: "Farewells and reflective conversations"
};

export const TOTAL_SCENARIOS = 30;

/**
 * Get scenario name by number
 */
export const getScenarioName = (scenarioNumber: number): string => {
  return SCENARIO_NAMES[scenarioNumber] || `Scenario ${scenarioNumber}`;
};

/**
 * Get all scenario names as array of objects
 */
export const getAllScenarios = () => {
  return Object.entries(SCENARIO_NAMES).map(([number, name]) => ({
    number: parseInt(number),
    name
  }));
};

