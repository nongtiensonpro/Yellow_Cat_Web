package org.yellowcat.backend.demo;

import jakarta.persistence.*;

@Entity
@Table(name = "demomodel")
public class Demomodel {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "demomodel_id_gen")
    @SequenceGenerator(name = "demomodel_id_gen", sequenceName = "demomodel_id_seq", allocationSize = 1)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "name")
    private String name;

    @Column(name = "age")
    private Integer age;

    public Demomodel(Integer age, String name) {
        this.age = age;
        this.name = name;
    }

    public Demomodel() {

    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

}