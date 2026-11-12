const fs = require('fs');

let code = fs.readFileSync('Backend/src/app/page.tsx', 'utf-8');

code = code.replace('function QronosDivider({ isNight })', 'function QronosDivider({ isNight }: { isNight: boolean })');
code = code.replace('function InteractiveDesksSection({ navigate, isNight })', 'function InteractiveDesksSection({ navigate, isNight }: { navigate: (p: string) => void; isNight: boolean })');
code = code.replace('const handleRowPointerMove = (e) =>', 'const handleRowPointerMove = (e: any) =>');
code = code.replace("style={{ '--mx': '50%', '--my': '50%' }}", "style={{ '--mx': '50%', '--my': '50%' } as any}");
code = code.replace('function InteractiveClosingCTA({ navigate, isNight })', 'function InteractiveClosingCTA({ navigate, isNight }: { navigate: (p: string) => void; isNight: boolean })');
code = code.replace('const boxRef = React.useRef(null);', 'const boxRef = React.useRef<any>(null);');
code = code.replace('const handleBoxMove = (e) =>', 'const handleBoxMove = (e: any) =>');
code = code.replace(`        style={{
          '--cx': '50%',
          '--cy': '50%',
          '--rx': '0deg',
          '--ry': '0deg',
        }}`, `        style={{
          '--cx': '50%',
          '--cy': '50%',
          '--rx': '0deg',
          '--ry': '0deg',
        } as any}`);
code = code.replace('export function LandingPage({ onEnter } = {})', 'export default function LandingPage({ onEnter }: { onEnter?: () => void } = {})');
code = code.replace('const navigate = (path) => router.push(path);', 'const navigate = (path: string) => router.push(path);');
code = code.replace('const lenisRef = useRef(null);', 'const lenisRef = useRef<any>(null);');
code = code.replace('const heroRef = useRef(null);', 'const heroRef = useRef<any>(null);');
code = code.replace('const pipeRef = useRef(null);', 'const pipeRef = useRef<any>(null);');
code = code.replace('const layRef = useRef(null);', 'const layRef = useRef<any>(null);');
code = code.replace('const jumpToStage = (idx) =>', 'const jumpToStage = (idx: number) =>');
code = code.replace('const onKey = (e) =>', 'const onKey = (e: any) =>');
code = code.replace('const handleHeroPointerMove = (e) =>', 'const handleHeroPointerMove = (e: any) =>');
code = code.replace('labels={STEPS}', 'steps={STEPS}');
code = code.replace('labels={LAYERS}', 'layers={LAYERS}');

fs.writeFileSync('Backend/src/app/page.tsx', code);
console.log('page.tsx types fixed');

