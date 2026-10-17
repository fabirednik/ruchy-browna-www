# Ruchy Browna | Wirtualne Laboratorium Fizyczne 2D

Interaktywna aplikacja edukacyjna oraz symulator fizyki cząstek w czasie rzeczywistym (2D Canvas), demonstrujący zjawisko **ruchów Browna**, **kinetyczną teorię materii** oraz **prawo dyfuzji Einsteina-Smoluchowskiego**.

Projekt łączy przystępne, zilustrowane wprowadzenie teoretyczne na poziomie szkoły średniej i wstępu do studiów z zaawansowanym wirtualnym laboratorium wyposażonym w live telemetrię, interaktywny wykres $\langle r^2 \rangle(t)$, histogram rozkładu prędkości Maxwella, dekoder wzorów oraz scenariusze badawcze.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Platform](https://img.shields.io/badge/technology-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-F7DF1E.svg)]()

---

## 🔬 O projekcie

W 1827 roku szkocki botanik **Robert Brown** zaobserwował pod mikroskopem nieustanny, chaotyczny taniec drobinek pyłku zanurzonych w wodzie. Dopiero w latach 1905–1906 **Albert Einstein** oraz polski fizyk **Marian Smoluchowski** niezależnie wyjaśnili ten fenomen: widoczna cząstka jest bezustannie bombardowana z każdej strony przez niewidzialne cząsteczki cieczy ($\sim 10^{14}$ zderzeń na sekundę!).

Aplikacja pozwala zwizualizować to, co przez stulecia było niewidoczne dla ludzkiego oka, umożliwiając intuicyjne zrozumienie m.in.:
- Fluktuacji sił i asymetrii zderzeń (dlaczego drga pyłek, a nie drga łyżeczka w szklance wody – Prawo Wielkich Liczb).
- Mikroskopowej definicji temperatury jako miary średniej energii kinetycznej ($\langle E_k \rangle = \frac{3}{2} k_B T$).
- Różnicy między drogą $s$ (długością toru) a przemieszczeniem $r$.
- Matematycznego paradoksu i prawa pierwiastka z czasu: dlaczego $\langle r^2 \rangle \propto t$, a odległość rośnie jak $\sqrt{t}$.

---

## ✨ Kluczowe funkcjonalności

### 1. Fizyka Cząstek w Czasie Rzeczywistym (HTML5 Canvas 2D)
- **Rzeczywiste zderzenia sprężyste 2D**: Rozwiązywanie układu równań zasady zachowania pędu i energii kinetycznej dla par cząstka–rozpuszczalnik oraz ścianek komory.
- **Opór hydrodynamiczny (Lepkość Stokesa)**: Płynne tłumienie pędu zgodnie z równaniem Stokesa $F_o = 6\pi \eta R v$.
- **Termostat Maxwella**: Utrzymywanie zadanego rozkładu prędkości termicznych cząsteczek cieczy w zależności od temperatury $T$.
- **Interakcja gestem**: Możliwość popchnięcia pyłku Browna kliknięciem lub przeciągnięciem myszką/dotykiem (nadanie wektora $\Delta \vec{p}$).

### 2. Live Telemetria i Oscyloskop Danych
- **Wykres $r^2(t)$ w czasie rzeczywistym**: Rysowanie zmierzonego kwadratu przemieszczenia w zestawieniu z linią teoretyczną Einsteina-Smoluchowskiego ($\langle r^2 \rangle = 4Dt$).
- **Histogram Maxwella**: Przełączany widok rozkładu prędkości atomów cieczy w czasie rzeczywistym z wyznaczoną prędkością średnią.
- **Pomiary na żywo**:
  - Czas trwania symulacji ($t$),
  - Licznik zderzeń oraz częstość zderzeń (uderzeń/s),
  - Chwilowa prędkość cząstki ($v$),
  - Wypadkowe przemieszczenie ($r = \sqrt{\Delta x^2 + \Delta y^2}$),
  - Kwadrat przemieszczenia ($r^2$),
  - Całkowita przebyta droga ($s_{\text{całk}}$).

### 3. Sześć Trybów Eksperymentalnych
1. **Widok Atomowy (Klasyczny)** – Pełny podgląd mikroskopowy: cząstka Browna w centrum oraz rój pędzących cząsteczek cieczy.
2. **Mikroskop Browna (1827)** – Ukrycie cząsteczek cieczy; obserwacja samotnego, „magicznego” tańca pyłku dokładnie tak, jak widział to Robert Brown.
3. **Porównanie Mas (Inercja)** – Dwie cząstki w jednym roju: lekka ($M_1$) oraz 15× cięższa ($M_2$). Wizualizacja I i II zasady dynamiki Newtona ($a = \frac{F}{M}$).
4. **Dyfuzja Kropli Barwnika** – 15 jednakowych cząstek barwnika startujących z jednego punktu i samoistnie rozpraszających się w naczyniu.
5. **Rentgen Wektorowy (Siła & Pęd)** – Spowolniony czas z rysowaniem wektorów prędkości $\vec{v}$, iskier zderzeń oraz impulsów siły.
6. **Komora ze Szczeliną** – Przegroda z wąskim otworem dzieląca naczynie na dwie komory. Badanie czasu losowego przejścia cząstki przez szczelinę.

### 4. Scenariusze Badawcze (Misje)
Wbudowana wysuwana szuflada z gotowymi misjami laboratoryjnymi:
- **Misja 1:** *Oczami Roberta Browna (1827)* – Obserwacja bez cząsteczek tła i demaskowanie sprawców.
- **Misja 2:** *Bezwładność a fluktuacje termiczne* – Porównanie zasięgów cząstek o różnej masie.
- **Misja 3:** *Gorączka Cząsteczek (100 K vs 900 K)* – Wpływ temperatury na nachylenie krzywej $r^2(t)$.
- **Misja 4:** *Droga a Przemieszczenie* – Wykazanie ogromnego ilorazu $s_{\text{całk}} / r$.
- **Misja 5:** *Zagadka Pierwiastka z Czasu ($\sqrt{t}$)* – Weryfikacja reguły: 2× większy zasięg wymaga 4× dłuższego czasu.

### 5. Interaktywny Dekoder Wzoru Einsteina-Smoluchowskiego
Klikalny panel analizy wzoru:
$$\langle r^2 \rangle = \frac{2 k_B T}{3 \pi \eta R} \cdot t$$
z dokładnym omówieniem roli każdego składnika:
- $T$ – Temperatura układu (w liczniku, $v \propto \sqrt{T}$),
- $R$ – Promień geometryczny cząstki (w mianowniku, bezwładność i uśrednianie uderzeń),
- $\eta$ – Lepkość dynamiczna płynu (w mianowniku, opór Stokesa),
- $k_B$ – Stała Boltzmanna (przelicznik Kelwinów na Dżule),
- $t$ – Czas trwania obserwacji (zależność liniowa dla $r^2$, pierwiastkowa dla $r$).

### 6. Personalizacja i Motywy
- **3 starannie dopracowane motywy wizualne**:
  - 🌙 **Ciemny Nowoczesny** (Dark Modern) – kontrastowy, laboratoryjny wygląd z ambientowym podświetleniem,
  - ☀️ **Jasny Nowoczesny** (Light Modern) – czysty, minimalistyczny interfejs do jasnych pomieszczeń,
  - 📖 **Podręcznikowy** (Textbook) – stylizowany na klasyczny papierowy podręcznik akademicki.
- Wybór motywu zapamiętywany jest w `localStorage`.

---

## 📐 Model fizyczno-matematyczny

Wirtualne laboratorium opiera się na klasycznych prawach dynamiki i termodynamiki statystycznej:

| Wielkość | Wzór | Znaczenie fizyczne |
|---|---|---|
| **Średnia energia kinetyczna** | $\langle E_k \rangle = \frac{1}{2}m v^2 = \frac{3}{2}k_B T$ | Temperatura jako miara mikroskopowego ruchu atomów |
| **Zasada zachowania pędu** | $\vec{p}_1 + \vec{p}_2 = \vec{p}_1' + \vec{p}_2'$ | Wymiana pędu podczas sprężystego zderzenia cząsteczek |
| **Opór hydrodynamiczny Stokesa** | $\vec{F}_o = -6\pi \eta R \vec{v}$ | Siła lepkości spowalniająca ruch cząstki w cieczy |
| **Twierdzenie Pitagorasa w 2D** | $r^2 = (\Delta x)^2 + (\Delta y)^2$ | Wyznaczenie kwadratu odległości od punktu początkowego |
| **Prawo dyfuzji w 2D** | $\langle r^2 \rangle = 4 D t$ | Liniowy wzrost średniego kwadratu przemieszczenia |
| **Współczynnik dyfuzji Einsteina** | $D = \frac{k_B T}{6\pi \eta R}$ | Relacja fluktuacyjno-dyssypacyjna |
| **Pełny wzór Einsteina-Smoluchowskiego (2D)** | $\langle r^2 \rangle = \frac{2 k_B T}{3\pi \eta R} \cdot t$ | Zależność kwadratu przemieszczenia od parametrów ośrodka |
| **Promień teoretyczny zasięgu** | $r_{\text{teor}} = \sqrt{4 D t} \propto \sqrt{t}$ | Pierwiastkowy wzrost obserwowanego zasięgu w czasie |

---

## 🎮 Sterowanie i skróty

- **Spacja (`Space`)**: Natychmiastowe zatrzymanie (pauza) lub wznowienie symulacji.
- **Kliknięcie / przeciągnięcie myszką**: Kliknij na pyłku i pociągnij, aby nadać mu impuls prędkości w wybranym kierunku.
- **Przyciski paska narzędzi**:
  - `Pauza / Start` – zatrzymanie pętli symulacji,
  - `Krok (+1)` – przesunięcie symulacji o dokładnie jedną klatkę (przydatne do analizy pojedynczych zderzeń),
  - `Centruj` – przywrócenie pyłku na środek ekranu z zachowaniem zebranych statystyk,
  - `Wyczyść ślad` – skasowanie dotychczasowej linii trajektorii,
  - `Reset` – pełny restart symulacji, czasu, wykresu i cząstek,
  - `Misje Badawcze` – wysunięcie panelu gotowych scenariuszy.

---

## 🛠️ Technologie

Aplikacja została napisana w czystym stosie webowym (**Zero Build Step, No Node.js required**):
- **HTML5** – semantyczna struktura dokumentu,
- **CSS3** – responsywny layout (CSS Grid, Flexbox), płynne animacje, zmienne CSS (CSS Custom Properties) do obsługi motywów,
- **JavaScript (ES6+)** – modularna architektura symulatora, wydajna pętla fizyki oparta na `requestAnimationFrame`,
- **Canvas API 2D** – renderowanie cząstek, trajektorii i oscyloskopu wykresu przy 60 FPS,
- **[KaTeX](https://katex.org/)** – błyskawiczne renderowanie wzorów matematycznych $\LaTeX$,
- **[Phosphor Icons](https://phosphoricons.com/)** – nowoczesny zestaw ikon wektorowych,
- **Google Fonts** – kroje pisma *Inter* oraz *JetBrains Mono*.

---

## 🚀 Jak uruchomić lokalnie

Projekt nie wymaga instalacji żadnych bibliotek, menedżerów pakietów ani procesów kompilacji.

### Sposób 1: Bezpośrednie otwarcie w przeglądarce
Wystarczy dwukrotnie kliknąć plik `index.html` lub przeciągnąć go do okna dowolnej nowoczesnej przeglądarki internetowej (Chrome, Edge, Firefox, Safari, Opera).

### Sposób 2: Za pomocą prostego serwera HTTP (zalecane)
Jeśli chcesz uruchomić projekt przez lokalny serwer WWW:

**Python 3:**
```bash
python -m http.server 8000
```
Następnie otwórz w przeglądarce: [http://localhost:8000](http://localhost:8000)

**Node.js (npx serve):**
```bash
npx serve .
```

**Rozszerzenie Live Server w VS Code:**
Kliknij prawym przyciskiem myszy na plik `index.html` i wybierz opcję **„Open with Live Server”**.

---

## 📁 Struktura plików

```text
ruchy-browna-www/
├── index.html        # Główny szkielet aplikacji, artykuł merytoryczny, laboratorium i dekoder
├── styles.css        # Kompletne arkusze stylów, system motywów, HUD, layout laboratoryjny
├── script.js         # Silnik symulacji 2D, termostat, oscyloskop, telemetria i obsługa zdarzeń
└── README.md         # Dokumentacja techniczna i merytoryczna projektu
```

---

## 👤 Autor

- **Fabian Dawidowski** – [@fabirednik](https://github.com/fabirednik)

---

## 📄 Licencja

Projekt udostępniany jest do celów edukacyjnych i demonstracyjnych na licencji [MIT](LICENSE).
