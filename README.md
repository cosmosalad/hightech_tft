# TFT Electrical Characterization Analyzer

A comprehensive web-based analysis tool for Thin-Film Transistor (TFT) electrical characterization using probe station measurement data.

![TFT Analyzer](https://img.shields.io/badge/TFT-Analyzer-blue) ![React](https://img.shields.io/badge/React-18.0+-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🔬 Overview

This React-based web application automatically analyzes TFT electrical characteristics from probe station measurements. Simply upload Excel files from your probe station, and the tool will generate comprehensive graphs and extract key TFT parameters through advanced calculation algorithms.

### 🎯 Key Features

- **Automated Parameter Extraction**: Calculates mobility, threshold voltage, subthreshold swing, and other critical TFT parameters
- **Multi-Measurement Analysis**: Supports IDVG-Linear, IDVG-Saturation, IDVD, and Hysteresis measurements
- **Sample-Based Data Fusion**: Groups measurements by sample name for integrated analysis
- **Advanced Mobility Calculations**: Implements Y-function method for accurate μ₀ and μₑff calculations
- **Quality Assessment System**: Evaluates data quality and provides reliability scores
- **Interactive Visualizations**: Real-time charts with customizable parameters

## 📊 Supported Measurements & Parameters

| Measurement Type | Extracted Parameters |
|-----------------|---------------------|
| **IDVG-Linear** | gₘ, μFE, μ₀, μₑff, Iₒₙ, Iₒff, Ion/Ioff ratio |
| **IDVG-Saturation** | Vₜₕ, SS, Dᵢₜ, ID,sat, gₘ,max |
| **IDVD** | Rₒₙ (On-resistance) |
| **IDVG-Hysteresis** | ΔVₜₕ, Stability assessment |

## 🏗️ TFT Fabrication Context

This tool is designed for analyzing TFTs fabricated with the following process splits:

### Process Parameters
- **Gate Dielectric**: SiO₂ (20nm, 60nm, 100nm splits)
- **Channel Layer**: IZO double-layer structure
 - **Layer 1**: 15-20nm thickness (Ar: 20sccm, O₂: 0sccm)
 - **Layer 2**: 15nm thickness (Ar: 20sccm, O₂: 0-3sccm splits)
- **Electrodes**: Al 100nm (E-beam evaporation + annealing)

## 🚀 Quick Start

**[🌐 Access the Live Application](https://m.site.naver.com/1JN3i)** - No installation required!

Simply visit the application and start uploading your probe station measurement files.

## 📁 File Format Requirements

### Supported File Types
- Excel files (.xls, .xlsx)
- Probe station measurement data

### File Naming Convention
For automatic detection, include measurement type in filename:
- `Sample1_IDVD.xlsx` - Output characteristics
- `Sample1_IDVG_Linear.xlsx` - Linear transfer characteristics
- `Sample1_IDVG_Saturation.xlsx` - Saturation transfer characteristics
- `Sample1_IDVG_Linear_Hysteresis.xlsx` - Hysteresis measurements

## 🧮 Calculation Algorithms

### Core TFT Parameters

#### Field-Effect Mobility (μFE)

μFE = L/(W×Cox×VDS) × gm,max

#### Low-Field Mobility (μ₀) - Y-Function Method
Y = ID/√gm = A×(VG - Vth)
μ₀ = A²L/(Cox×VD×W)

#### Effective Mobility (μeff)
μeff = μ₀ / (1 + θ(VG - Vth))

#### Threshold Voltage (Vth)
Linear extrapolation from gm,max point
Vth = VG,max - log(ID,max) / slope

#### Subthreshold Swing (SS)
SS = dVG/d(log ID) = 1/slope

#### Interface Trap Density (Dit)
Dit = (Cox/q) × (SS/(2.3×kT/q) - 1)

## 🎛️ Analysis Modes

### 1. Basic Analysis Mode
- Individual file analysis
- Fast parameter extraction
- Educational and quick verification purposes

### 2. Integrated Analysis Mode ⭐ **Recommended**
- Sample-based data grouping
- Cross-measurement parameter optimization
- Research-grade accuracy
- Quality assessment and validation

## 📈 Features in Detail

### Data Processing Pipeline
1. **File Upload & Detection**: Automatic measurement type recognition
2. **Data Parsing**: Excel file processing with robust error handling
3. **Parameter Calculation**: Physics-based algorithms for accurate extraction
4. **Data Fusion**: Sample-based integration for optimal results
5. **Quality Assessment**: Reliability scoring and validation warnings

### Interactive Visualizations
- **Transfer Characteristics**: ID-VG plots with log/linear scales
- **Output Characteristics**: ID-VD family curves
- **Transconductance**: gm vs VG plots
- **Hysteresis Loops**: Forward/backward sweep comparison

### Device Parameter Input
- Channel width (W) and length (L)
- Gate oxide thickness (tox)
- Automatic Cox calculation

## 🔧 Technology Stack

- **Frontend**: React 18+ with Hooks
- **Visualization**: Recharts for interactive graphs
- **File Processing**: SheetJS for Excel parsing
- **Styling**: Tailwind CSS
- **Mathematical Operations**: Custom calculation utilities

## 📚 Scientific Background

This tool implements established semiconductor characterization methods:

- **Y-Function Method**: Ghibaudo, G. (1988) for mobility extraction
- **Subthreshold Analysis**: Based on MOSFET physics principles
- **Interface Trap Calculations**: Following Nicollian-Brews methodology

## 🤝 Contributing

We welcome contributions from the semiconductor community!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas for Contribution
- Additional measurement types (IG-VG, CV measurements)
- New mobility models (Universal mobility model, etc.)
- Temperature-dependent analysis
- Advanced statistical analysis tools

## 🐛 Issues & Feature Requests

Found a bug or have a feature request? Please open an issue on GitHub with:
- Detailed description of the problem/request
- Sample data files (if applicable)
- Expected vs actual behavior
- Your browser/system information

## 📖 Documentation

Detailed documentation including:
- Formula verification and validation
- Code structure explanation
- API reference for developers
- Measurement best practices

Access the formula inspector within the application for real-time code verification.

---
