export function multiplierFromBurn(burned: number): number {
    // Diminishing returns model
    if (burned <= 0) return 1.0;
  
    const maxMultiplier = 1.25;
    const scale = 1000000; // adjust later
  
    const value = 1 + 0.25 * (1 - Math.exp(-burned / scale));
  
    return Math.min(value, maxMultiplier);
  }
  