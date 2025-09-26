import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态导入新版编译器
const bootstrapCompilerPath = 'file:///E:/RustroverProjects/nyar-framework/valkyrie.valkyrie/projects/valkyrie-bootstrap/bootstrap/index.js';
const compiler = await import(bootstrapCompilerPath);

// 模拟构建脚本的库文件编译过程
const libraryFiles = [
    'library/_.valkyrie',
    'library/builder.valkyrie',
    'library/project_discovery.valkyrie',
    'library/cleaner.valkyrie',
    'library/watcher.valkyrie'
];

const fileContents = {};
for (const file of libraryFiles) {
    const fullPath = join(__dirname, file);
    console.log(`检查文件: ${fullPath}`);
    if (fs.existsSync(fullPath)) {
        console.log(`✓ 找到文件: ${file}`);
        fileContents[file] = fs.readFileSync(fullPath, 'utf8');
    } else {
        console.log(`✗ 文件不存在: ${file}`);
    }
}

console.log(`\n总共找到 ${Object.keys(fileContents).length} 个文件`);

if (Object.keys(fileContents).length > 0) {
    console.log('\n=== 编译库文件 ===');
    try {
        const result = compiler.package_compiler_generate_single_js(fileContents);
        
        console.log('编译结果类型:', typeof result);
        console.log('编译结果结构:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
        
        if (result && typeof result === 'object') {
            if (result.success === true) {
                console.log('✅ 编译成功！');
                console.log('生成的代码长度:', result.code ? result.code.length : 0);
                
                // 保存编译结果
                const outputPath = join(__dirname, 'dist', 'debug-legion.js');
                fs.mkdirSync(join(__dirname, 'dist'), { recursive: true });
                fs.writeFileSync(outputPath, result.code);
                console.log(`\n✓ 调试文件已保存: ${outputPath}`);
            } else if (result.success === false) {
                console.log('❌ 编译失败:', result.error);
            } else {
                console.log('🤔 未知的返回格式');
            }
        } else {
            console.log('🤔 返回结果不是对象格式');
        }
    } catch (error) {
        console.log('❌ 编译过程抛出异常:', error.message);
    }
}