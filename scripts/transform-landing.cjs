const fs = require('fs');

let code = fs.readFileSync('Frontend/src/pages/landing/LandingPage.jsx', 'utf-8');

code = `'use client';\n\n` + code;
code = code.replace("import { useNavigate } from 'react-router-dom';", "import { useRouter } from 'next/navigation';");
code = code.replaceAll('../../components/ui/', '@/components/editorial/');
code = code.replaceAll('../../fx/', '@/fx/');
code = code.replaceAll('../../theme/', '@/theme/');
code = code.replaceAll('../../three/', '@/three/');
code = code.replace("import { useStore } from '../../lib/store';", "// useStore removed");
code = code.replace("const { markPipelineScrolled } = useStore();", "const markPipelineScrolled = () => {};");
code = code.replace("const navigate = useNavigate();", "const router = useRouter();\n  const navigate = (path) => router.push(path);");

fs.writeFileSync('Backend/src/app/page.tsx', code);
console.log('Backend/src/app/page.tsx written successfully');

