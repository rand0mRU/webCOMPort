void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial.available() > 0) {
    int read = Serial.read();
    if (read == 10) {
      Serial.println("New line symbol!");
    }
    if (read == 13) {
      Serial.println("Carriage return symbol!");
    }
  }
}
