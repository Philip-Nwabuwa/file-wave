import React, { useRef } from "react";
import { Socket } from "socket.io-client";

interface FileUploaderProps {
  socket: Socket;
  room: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ socket, room }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = () => {
    if (fileInputRef.current && fileInputRef.current.files) {
      const file = fileInputRef.current.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit("fileUpload", { file: reader.result, room });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input type="file" ref={fileInputRef} />
      <button onClick={handleFileUpload}>Upload File</button>
    </div>
  );
};

export default FileUploader;
