const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Транскрибация видео/аудио через Python скрипт с Whisper
 */
async function transcribe(videoPath, outputPath = "transcript.txt") {
  console.log(`🎬 Начинаю обработку файла: ${videoPath}`);

  // Проверяем существование входного файла
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Файл не найден: ${videoPath}`);
  }

  // Проверяем существование Python скрипта
  const pythonScriptPath = path.join(__dirname, "script.py");
  if (!fs.existsSync(pythonScriptPath)) {
    throw new Error(`Python скрипт не найден: ${pythonScriptPath}`);
  }

  // Проверяем наличие Python
  try {
    await checkPythonAvailable();
  } catch (error) {
    throw new Error(
      "Python3 не найден. Установите Python: https://www.python.org/downloads/"
    );
  }

  console.log("🐍 Запускаю Python скрипт...");

  return new Promise((resolve, reject) => {
    const python = spawn("python3", [pythonScriptPath, videoPath, outputPath]);

    let stderr = "";

    python.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    python.on("error", (error) => {
      reject(new Error(`Ошибка запуска Python: ${error.message}`));
    });

    python.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ Транскрибация завершена успешно!`);
        resolve(outputPath);
      } else {
        reject(
          new Error(
            `Python процесс завершился с ошибкой (код ${code}):\n${stderr}`
          )
        );
      }
    });
  });
}

/**
 * Проверка наличия Python в системе
 */
function checkPythonAvailable() {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", ["--version"]);

    python.on("error", (error) => {
      reject(error);
    });

    python.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("Python не найден"));
      }
    });
  });
}

/**
 * Проверка установленных зависимостей Python
 */
async function checkDependencies() {
  console.log("🔍 Проверяю зависимости Python...");

  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      "-c",
      "import whisper; import sys; import tqdm",
    ]);

    python.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Все зависимости установлены");
        resolve();
      } else {
        console.log("❌ Не установлены зависимости Python");
        console.log(
          "💡 Установите их командой: pip3 install openai-whisper tqdm"
        );
        reject(new Error("Отсутствуют зависимости Python"));
      }
    });
  });
}

// Точка входа
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(
      "Использование: node script.js <путь_к_видео> [путь_к_выходному_файлу]"
    );
    console.log("\nПримеры:");
    console.log("  node script.js video.mp4");
    console.log("  node script.js video.mp4 transcript.txt");
    console.log("  node script.js rec.m4a result.txt");
    console.log("\nТребования:");
    console.log("  - Python 3.7+");
    console.log("  - pip3 install openai-whisper tqdm");
    process.exit(1);
  }

  const videoFile = args[0];
  const outputFile = args[1] || "transcript.txt";

  // Запускаем транскрибацию
  (async () => {
    try {
      await checkDependencies();
      const result = await transcribe(videoFile, outputFile);
      console.log(`\n📄 Результат сохранён в: ${result}`);
    } catch (error) {
      console.error("\n❌ Ошибка:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = { transcribe, checkDependencies };
