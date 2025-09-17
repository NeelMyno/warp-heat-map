# CSV Upload Guide for Lane Heatmap

## Overview
The Lane Heatmap application now supports uploading custom CSV files to visualize shipping lanes and logistics data. The system is designed to handle any CSV file that contains company names, origin ZIP codes, and destination ZIP codes.

## Supported CSV Format

### Required Columns
Your CSV file should contain these three types of data:

1. **Company/Customer Name** - The name of the company or customer
2. **Origin ZIP Code** - The starting location (5-digit ZIP code)
3. **Destination ZIP Code** - The ending location (5-digit ZIP code)

### Flexible Column Names
The system automatically detects various column name formats:

#### Company/Name Columns:
- `name`, `company`, `companyname`, `customer`, `customername`, `account`, `client`, `business`

#### Origin Columns:
- `origin`, `originzip`, `originzipcode`, `fromzip`, `pickupzip`, `shipperzip`, `orig`, `origzip`, `from`, `pickup`, `shipper`

#### Destination Columns:
- `destination`, `destinationzip`, `destinationzipcode`, `destzip`, `tozip`, `deliveryzip`, `consigneezip`, `dest`, `to`, `delivery`, `consignee`

### Sample CSV Format
```csv
name,origin,destination
Consultant,60035,77479
Doersbiz.com,8901,28610
Upward Projects,85012,78704
LYMERTIN COMPANY INC,10307,33020
Bevmo,94706,94530
```

## How to Upload

### Method 1: Using the Sidebar
1. Open the application
2. In the left sidebar, click "Upload CSV Data"
3. Click the upload area or drag and drop your CSV file
4. The data will be processed and displayed on the map

### Method 2: Using the Header Button
1. Click the "Load CSV" button in the top header
2. Select your CSV file from the file dialog
3. The data will be processed and displayed on the map

## ZIP Code Handling

### Automatic ZIP Code Processing
- The system automatically cleans and formats ZIP codes
- Removes non-numeric characters
- Pads short ZIP codes with leading zeros
- Truncates long ZIP codes to 5 digits

### Fallback Coordinate System
**No ZIP codes are skipped!** The system includes a fallback mechanism:

1. **Primary Lookup**: Uses comprehensive ZIP code database for accurate coordinates
2. **Fallback System**: For unknown ZIP codes, generates approximate coordinates based on ZIP code ranges:
   - 01000-19999: Northeast region
   - 20000-39999: Southeast region  
   - 40000-59999: Midwest region
   - 60000-79999: Central region
   - 80000-99999: Western region

### Information Messages
- Blue info message: Shows how many ZIP codes are using fallback coordinates
- All ZIP codes are displayed on the map, even if not found in the reference database

## Features

### Visual Feedback
- Drag and drop interface with visual feedback
- Loading indicators during file processing
- Error messages for invalid files
- Success confirmation with lane count

### Data Validation
- Automatic file type validation (CSV only)
- Row-by-row processing with error handling
- Comprehensive logging of processing results

### Map Integration
- Automatic map updates with new data
- Lane visualization between origin and destination
- Point markers for all ZIP code locations
- Interactive controls for data filtering

## Troubleshooting

### Common Issues

1. **File Not Loading**
   - Ensure file has .csv extension
   - Check that required columns exist
   - Verify CSV format is valid

2. **Missing Data on Map**
   - Check console for processing messages
   - Verify ZIP codes are 5-digit format
   - Ensure origin and destination columns have data

3. **Performance Issues**
   - Large files (>1000 rows) may take time to process
   - Consider breaking very large datasets into smaller files

### Error Messages
- "Please select a CSV file": Wrong file type selected
- "Failed to load CSV file": File parsing error or network issue
- Processing warnings in console: Individual row issues (non-critical)

## Technical Details

### Processing Pipeline
1. File validation and reading
2. CSV parsing with header detection
3. Column mapping and data extraction
4. ZIP code cleaning and validation
5. Coordinate lookup (primary + fallback)
6. Lane and point generation
7. Map visualization update

### Performance Optimizations
- Efficient CSV parsing with Papa Parse library
- Batch processing of coordinates
- Optimized map rendering
- Memory-efficient data structures

## Support
For issues or questions about CSV upload functionality, check the browser console for detailed error messages and processing logs.
