# STL Weight Estimator API Integration

## Overview

The ordering system has been completely revamped to use the external STL Weight Estimator API for accurate weight calculations. This replaces the previous local volume calculation system with a more sophisticated API that considers infill patterns, shell thickness, and material properties.

## Key Changes

### 1. API Integration
- **Endpoint**: `https://stl-api-66l8.onrender.com/estimate-weight`
- **Method**: POST with multipart form data
- **Parameters**:
  - `file`: STL file (binary)
  - `infill_percentage`: 0-100 (user configurable)
  - `material_density`: g/cm³ (from Firestore materials database)
  - `line_thickness`: 0.2mm (hard-coded)
  - `layer_height`: 0.2mm (hard-coded)
  - `shell_count`: 2 (hard-coded)

### 2. Reactive Calculation System
The system now automatically recalculates weight and cost when:
- Material selection changes (affects density)
- Infill percentage changes
- Color selection changes (triggers cost recalculation)
- Quantity changes (updates total cost)

### 3. Material Density Integration
- Material densities are automatically retrieved from the Firestore materials database
- Common material densities:
  - PLA: 1.24 g/cm³
  - ABS: 1.04 g/cm³
  - PETG: 1.27 g/cm³
  - TPU: 1.20 g/cm³
  - Nylon: 1.13 g/cm³

## API Response Format

```json
{
  "weight_grams": 27.45,
  "total_volume_cm3": 15.2345,
  "solid_volume_cm3": 12.1234,
  "infill_volume_cm3": 8.5678,
  "shell_volume_cm3": 3.5556
}
```

## Implementation Details

### New Functions

#### `calculateWeightWithAPI(card)`
- Sends STL file and parameters to external API
- Stores weight and volume data in card dataset
- Triggers cost recalculation

#### `updateCardCost(card)`
- Calculates cost using weight × material price per gram
- Updates price and cost displays
- Handles quantity calculations

#### `getMaterialDensity(materialName)`
- Retrieves material density from Firestore materials
- Returns default PLA density (1.24) if material not found

### Event Listeners

The system now includes reactive event listeners:

```javascript
// Material change triggers weight recalculation
materialSelect.addEventListener('change', function() {
  // Update color options
  // Recalculate weight with new density
  calculateWeightWithAPI(card);
});

// Infill change triggers weight recalculation
infillInput.addEventListener('change', () => {
  calculateWeightWithAPI(card);
});

// Color change triggers cost recalculation
colorSelect.addEventListener('change', function() {
  updateMeshColor(card);
  calculateWeightWithAPI(card);
});

// Quantity change triggers cost recalculation
qtyInput.addEventListener('change', () => {
  updateCardCost(card);
});
```

## Cost Calculation

The new cost calculation is simplified and more accurate:

```
Unit Cost = Weight (grams) × Material Price per Gram
Total Cost = Unit Cost × Quantity
```

This eliminates the need for complex backend calculations and provides real-time pricing based on actual material usage.

## UI Improvements

### Summary Panel
- Enhanced summary items with material and weight information
- Better visual hierarchy with separate name, details, and price sections
- Improved styling with background colors and borders

### Checkout Modal
- Updated checkout items to show material and weight
- Consistent styling with summary panel
- Better information display

### Loading States
- Added rotating refresh icon during order processing
- Improved user feedback during API calls

## Testing

A comprehensive test script (`test_stl_api_integration.py`) has been created to verify:
- API connectivity and response format
- Different material density calculations
- Error handling

### Test Results
The API successfully calculates weights for different materials:
- PLA (1.24 g/cm³): ~307.52g for 100mm cube
- ABS (1.04 g/cm³): ~257.92g for 100mm cube
- PETG (1.27 g/cm³): ~314.96g for 100mm cube
- TPU (1.20 g/cm³): ~297.60g for 100mm cube
- Nylon (1.13 g/cm³): ~280.24g for 100mm cube

## Benefits

1. **Accuracy**: Uses sophisticated 3D printing algorithms for weight calculation
2. **Real-time**: Reactive system updates calculations instantly
3. **Reliability**: External API provides consistent results
4. **Scalability**: No local computational overhead
5. **Maintainability**: Simplified codebase with clear separation of concerns

## Migration Notes

- Removed complex local volume calculation functions
- Eliminated backend weight calculation endpoints
- Simplified cost calculation to use direct weight × price formula
- Updated all event listeners for reactive behavior
- Enhanced UI components for better user experience

## Future Enhancements

1. **Caching**: Implement API response caching for repeated calculations
2. **Batch Processing**: Support for multiple STL files in single API call
3. **Advanced Parameters**: User-configurable layer height and shell count
4. **Error Recovery**: Fallback calculations if API is unavailable
5. **Analytics**: Track API usage and performance metrics 