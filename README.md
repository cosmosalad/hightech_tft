<div align="center">
  <img src="https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/public/logo192.png" width="120" alt="TFT Analyzer Logo" style="margin-bottom: 20px;" onerror="this.src='https://img.icons8.com/color/144/000000/microchip.png'" />

  <h1>TFT Electrical Characterization Analyzer</h1>
  
  <p><b>박막 트랜지스터(TFT) 전기적 특성 자동 분석 및 통합 시뮬레이션 웹 플랫폼</b></p>
  
  <p>
    <a href="https://cosmosalad.github.io/hightech_tft/">
      <img src="https://img.shields.io/badge/Launch_App-Live_Demo-0052FF?style=for-the-badge&logo=react&logoColor=white" alt="Live Demo" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-18.0%2B-61DAFB.svg?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" /></a>
  </p>

  <br />
</div>

---

## 1. Overview

> 반도체 Probe Station에서 측정된 원시 데이터(Raw Data)를 기반으로 박막 트랜지스터의 핵심 전기적 파라미터를 자동으로 추출 및 분석하는 웹 기반 데이터 툴입니다.

---

## 2. Key Features

<details open>
<summary><b>Automated Parameter Extraction</b></summary>
<br>

- 주요 인자 자동 계산: 이동도($\mu_{FE}$, $\mu_0$, $\mu_{eff}$), 문턱 전압($V_{th}$), SS(Subthreshold Swing), 온/오프 전류 비($I_{on}/I_{off}$), 접촉 저항($R_{on}$), 계면 결함 밀도($D_{it}$) 등 핵심 소자 특성을 업로드 즉시 자동 연산합니다.
- 다중 측정 지원: ID-VG (Linear/Saturation), ID-VD, Hysteresis 등 엑셀 데이터를 자동으로 파싱 및 분류 처리합니다.
</details>

<details open>
<summary><b>Advanced Integrated Analysis</b></summary>
<br>

- 샘플 기반 데이터 융합: 하나로 샘플링된 측정 데이터 셋(IDVG, IDVD 병합) 기반으로 종합적인 트랜지스터 모델 파라미터를 도출합니다.
- 고급 파라미터 추출: Y-Function 방법론과 실제 $C_{ox}$ 연산을 거친 이동도 추출을 적용하여 연구 수준의 정밀도를 보장합니다.
- 자동 품질 평가 시스템(QAS): 측정 데이터 노이즈, 모델 피팅의 R-Square 등을 평가하여 Quality Score 등급을 부여합니다.
</details>

<details open>
<summary><b>Utilities & Educational Simulation</b></summary>
<br>

- TLM 및 마스크 뷰어: 접촉 저항($R_c$) 변화 추이 분석 및 소자 공정 포토 마스크 설계 렌더링 기능을 지원합니다.
- 공정 시뮬레이터: 포토리소그래피, 박막 증착(Deposition), 식각(Etching) 단계를 애니메이션 형태로 학습할 수 있습니다.
- 이론 투명성: 계산 로직의 소스 코드 및 수식을 전면 공개합니다.
</details>

<br>

---

## 3. Supported Parameters

| 측정 모드 | 주요 추출 파라미터 및 특성 분석 |
| :--- | :--- |
| **IDVG-Linear** | $g_m$, $V_{th}$, $\mu_{FE}$, $\mu_0$, $\mu_{eff}$, $I_{on}/I_{off}$, $g_{m,max}$ (선형 영역 기본 특성 연산) |
| **IDVG-Saturation** | $I_{D,sat}$, $g_{m,sat}$ (포화 영역 캐리어 거동 분석) |
| **IDVD** | $R_{on}$ (On-resistance), Early Voltage 효과, Output Family Curves |
| **IDVG-Hysteresis** | $\Delta V_{th}$ 히스테리시스 창, 전하 트랩(Charge Trapping) 현상 및 신뢰성 검증 |

---

## 4. Physics Formulations

반도체 소자 물리학 서적과 추출 정규 방법론을 준수합니다.

<div align="center">
  
| 파라미터 | 수식 (Formula) | 비고 |
| :--- | :---: | :--- |
| **Field-Effect Mobility** ($\mu_{FE}$) | $\mu_{FE} = \frac{L}{W \cdot C_{ox} \cdot V_{DS}} \times g_{m,max}$ | Peak transconductance |
| **Y-Function Method** ($\mu_0$) | $Y = \frac{I_D}{\sqrt{g_m}} = A \cdot (V_G - V_{th})$ | Contact resistance 배제 |
| **Effective Mobility** ($\mu_{eff}$) | $\mu_{eff} = \frac{\mu_0}{1 + \theta(V_G - V_{th})}$ | $\theta$: Mobility degradation |
| **Interface Trap Density** ($D_{it}$) | $D_{it} = \frac{C_{ox}}{q} \left( \frac{SS}{2.3 \frac{kT}{q}} - 1 \right)$ | Subthreshold 기법 활용 |

</div>

---


## 5. Data Requirements

시스템에서 원활한 자동 데이터 파싱을 위해 지켜야 할 파일 규격 제한입니다.

- 확장자: `.xls`, `.xlsx`, `.csv` 
- 명명 규칙: 파일명 내에 핵심 키워드(`IDVD`, `Linear`, `Saturation`, `Hysteresis` 등)를 필수로 포함해야 합니다.

---

## 6. Tech Stack

<table>
  <tr>
    <td align="center" width="25%"><b>Frontend Core</b></td>
    <td align="center" width="25%"><b>Styling & UX</b></td>
    <td align="center" width="25%"><b>Data Processing</b></td>
    <td align="center" width="25%"><b>Data Visualization</b></td>
  </tr>
  <tr>
    <td align="center">React 18<br>React Hooks</td>
    <td align="center">Tailwind CSS<br>Lucide Icons</td>
    <td align="center">SheetJS (xlsx)<br>Custom Math Engine</td>
    <td align="center">Recharts<br>Framer Motion<br>Three.js</td>
  </tr>
</table>

---

## 7. Fabrication Context

알고리즘 검증 및 최적화 과정에서 활용된 베이스라인 TFT 공정 Reference 환경 스펙입니다.

- **Gate Dielectric**: $SiO_2$ (20nm, 60nm, 100nm Variation)
- **Channel Layer**: IZO Double-Layer Structure ($O_2$ 분압 변화 조절)
- **Electrodes**: Al (100nm / E-beam Evaporation)

---

## 8. License

이 프로젝트는 **MIT License**를 따릅니다. 
학술, 교육, 상업을 포함한 모든 목적 및 연구 활동에 자유롭게 사용, 수정, 배포가 가능합니다.

<div align="center">
  <p><b>© 2025 폴리텍 성남캠퍼스 하이테크 반도체공정.</b></p>
</div>
