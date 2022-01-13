import React, { useState, useRef, useEffect } from "react";
import CryptoJS from "crypto-js";
import "./App.css";

function App() {
  const [imageSource, setImageSource] = useState("");
  const [typeOfEncrypt, setTypeOfEncrypt] = useState("");

  const styles = {
    hidden: {
      display: "none",
    },
    visible: {
      display: "block",
    },
  };

  const [chooseTypeStyleRead, setChooseTypeStyleRead] = useState(styles.hidden);
  const [chooseTypeStyleWrite, setChooseTypeStyleWrite] = useState(
    styles.hidden
  );
  const [writeData, setWriteData] = useState("");
  const [resultData, setResultData] = useState("");
  const [degree, setDegree] = useState("");
  const inputFile = useRef(null);
  const inputImage = useRef(null);
  const canvasRef = useRef(null);
  const [text, setText] = useState("");
  const refImage = useRef(null)

  function radioButtonChanged(e) {
    if (e.target.value === "read") {
      setChooseTypeStyleRead(styles.visible);
      setChooseTypeStyleWrite(styles.hidden);
      setTypeOfEncrypt(0);
    } else {
      setChooseTypeStyleRead(styles.hidden);
      setChooseTypeStyleWrite(styles.visible);
      setTypeOfEncrypt(1);
    }
  }
  function imageEncrypt(e) {
    e.preventDefault();
    if (typeOfEncrypt !== "" && degree !== "" && imageSource !== "") encrypt();
  }
  function changeDegree(e) {
    if (
      e.target.value.length < 2 &&
      (e.target.value === "" || e.target.value > 0) &&
      e.target.value % 2 === 0
    )
      setDegree(e.target.value);
  }
  useEffect(() => {
    if (text) {
      setResultData(`0) Изначальный текст\n${text}`);
      const key = CryptoJS.enc.Utf8.parse("aaaa");
      const iv = CryptoJS.enc.Utf8.parse("aaaa");
      let encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv });
      setResultData((prev) => `${prev}\n\n1) Считывание файла симметричным алгоритмом AES\n${encrypted.toString()}`);
      const hash = CryptoJS.SHA256(encrypted);
      setResultData((prev) => `${prev}\n\n2) Получаем hash с использованием SHA2\n${hash}`);
      setResultData(
        (prev) => `${prev}\n\n3) Hash добавлен к файлу\n${hash}\n${text}`
      );
      encrypted = CryptoJS.AES.encrypt(`${hash}\n${text}`, key, {
        iv: iv,
      });
      setResultData((prev) => `${prev}\n\n4) Шифруем файл симметричным алгоритмом AES\n${encrypted.toString()}`);
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d");
      let clampedArray = ctx.getImageData(0, 0, canvas.width, canvas.height)
      console.log("Изначальный контейнер")
      console.log(clampedArray)
      let u8 = clampedArray.data.map(e => {
        const first2bit = e & 0x03
        const first4bitMiddle = (e & 0x0C) >> 2
        const first6bitMiddle = (e & 0x30) >> 4
        const first8bitMiddle = (e & 0xC0) >> 6

        e = (e & 0xFC) | first2bit
        e = (e & 0xFC) | first4bitMiddle
        e = (e & 0xFC) | first6bitMiddle
        e = (e & 0xFC) | first8bitMiddle
        return e
      });
      let imageData = new ImageData(u8, clampedArray.width, clampedArray.height)
      console.log("Новый контейнер")
      console.log(imageData)
      ctx.putImageData(imageData, 0, 0)
      setResultData(
        (prev) =>
          `${prev}\n\n5) Поместить зашифрованный файл в BMP-контейнер по алгоритму LSB
          \n${degree} последних бита обнулено и занесено новое значение
          \nГотово(смотреть console.log)`
      );
      let decrypted = CryptoJS.AES.decrypt(encrypted.toString(), key, {
        iv: iv,
      }).toString(CryptoJS.enc.Utf8);
      setResultData((prev) => `${prev}\n\n6) Извлечь данные из BMP-контейнера\n${encrypted.toString()}`);
      setResultData((prev) => `${prev}\n\n7) Расшифровуем с использованием ключа симметричного алгоритма\n${decrypted}`);
      const message = decrypted.slice(hash.toString().length);
      const messageEncrypt = CryptoJS.AES.encrypt(message, key, { iv: iv });
      const hash2 = CryptoJS.SHA256(messageEncrypt);
      setResultData(
        (prev) =>
          `${prev}\n\n8) Целостность данных\nЦифровой ключ изначального текста равен: ${hash.toString()}
        \nЦифровой ключ полученного текста равен: ${hash2.toString()}
        \nПроверка на совпадение: ${hash.toString() === hash2.toString()}`
      );
    }
  }, [text]);
  function encrypt() {
    if (typeOfEncrypt) setText(writeData);
    else if (inputFile.current) {
      const file = inputFile.current.files[0];
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        setText(reader.result);
      };
    }
  }

  useEffect(() => {
    const image = new Image()
    image.src = imageSource
    
    image.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = refImage.current.width
      canvas.height = refImage.current.height
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    };
  }, [inputImage.current]);

  return (
    <section className="wrapper">
      <canvas ref={canvasRef}></canvas>
      <h1>Лабораторная работа №6 - LSB алгоритм</h1>
      <header>
        <form>
          <label htmlFor="image">Выберите изображение: </label>
          <input
            id="image"
            type="file"
            accept=".jpeg,.jpg,.bmp"
            onChange={(e) => setImageSource(e.target.files[0].name)}
            ref={inputImage}
          ></input>
          <br />
          <label htmlFor="degree">Выберите степень: </label>
          <input
            id="degree"
            type="text"
            value={degree}
            onChange={changeDegree}
            placeholder="2, 4, 6, 8"
          />
          <p>Выберите тип</p>
          <p>
            <label>
              Шифрование данных из файла{" "}
              <input
                type="radio"
                name="checkbox"
                value="read"
                onChange={radioButtonChanged}
              />
            </label>
            <label>
              Шифрование написанного текста{" "}
              <input
                type="radio"
                name="checkbox"
                value="write"
                onChange={radioButtonChanged}
              />
            </label>
          </p>
          <input
            type="file"
            accept=".txt"
            style={chooseTypeStyleRead}
            ref={inputFile}
          />
          <textarea
            style={chooseTypeStyleWrite}
            value={writeData}
            onChange={(e) => setWriteData(e.target.value)}
            placeholder="Начните вводить текст"
          ></textarea>
          <button onClick={imageEncrypt}>Шифрование</button>
        </form>
        <img ref={refImage} src={imageSource} alt="Картинка ещё не выбрана"></img>
      </header>
      <textarea className="resultData" value={resultData} readOnly />
    </section>
  );
}

export default App;
