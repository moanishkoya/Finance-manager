
package com.expensetracker.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="transactions")
public class Transaction {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
 private Long id;
 private String description;
 private BigDecimal amount;
 @Enumerated(EnumType.STRING)
 private TransactionType type;
 private String category;
 private LocalDate date;
 public Long getId(){return id;} public void setId(Long id){this.id=id;}
 public String getDescription(){return description;} public void setDescription(String d){this.description=d;}
 public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal a){this.amount=a;}
 public TransactionType getType(){return type;} public void setType(TransactionType t){this.type=t;}
 public String getCategory(){return category;} public void setCategory(String c){this.category=c;}
 public LocalDate getDate(){return date;} public void setDate(LocalDate d){this.date=d;}
}
